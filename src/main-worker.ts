import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import * as amqp from 'amqplib';

async function bootstrap() {
    // Assert queues before starting the worker to ensure topology is correct
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();

    // 1. Assert Wait Queue (Dead Letters back to Main Queue after TTL)
    await channel.assertQueue('email_queue_wait', {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: 'email_queue', // Loop back to Main for retry
        messageTtl: 5000, // 5 seconds delay
    });

    // 2. Assert Main Queue (Dead Letters to Wait Queue on failure)
    await channel.assertQueue('email_queue', {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: 'email_queue_wait',
    });

    // 3. Assert Final DLQ (for messages that exceed max retries)
    await channel.assertQueue('email_queue_dlq', {
        durable: true,
    });

    await connection.close();

    // Create application without HTTP server
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'email_queue',
            queueOptions: {
                durable: true,
                deadLetterExchange: '',
                deadLetterRoutingKey: 'email_queue_wait',
            },
            noAck: false, // Manual acknowledgment
        },
    });

    await app.listen();

    console.log('Worker Service is consuming from email_queue');
}

bootstrap();
