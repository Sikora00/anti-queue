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

    // --- Marketing Queue Setup (Per-Message TTL) ---

    // 4. Assert Marketing Wait Queue (No fixed TTL)
    await channel.assertQueue('marketing_queue_wait', {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: 'marketing_queue', // Loop back to Main for retry
    });

    // 5. Assert Marketing Main Queue
    await channel.assertQueue('marketing_queue', {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: 'marketing_queue_wait',
    });

    // 4. Assert Reporting Exchange (Delayed Message) & Queue
    const reportingExchange = 'reporting_exchange';
    const reportingQueue = 'reporting_queue';

    await channel.assertExchange(reportingExchange, 'x-delayed-message', {
        durable: true,
        arguments: { 'x-delayed-type': 'direct' }
    });

    await channel.assertQueue(reportingQueue, {
        durable: true,
    });

    await channel.bindQueue(reportingQueue, reportingExchange, reportingQueue);

    await connection.close();

    // Create application without HTTP server
    const app = await NestFactory.create(AppModule);

    // 1. Email Service
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'email_queue',
            queueOptions: {
                durable: true,
                deadLetterExchange: '',
                deadLetterRoutingKey: 'email_queue_wait',
            },
            noAck: false,
        },
    });

    // 2. Reporting Service
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'reporting_queue',
            queueOptions: {
                durable: true,
            },
            noAck: false,
        },
    });

    // 3. Marketing Service
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'marketing_queue',
            queueOptions: {
                durable: true,
                deadLetterExchange: '',
                deadLetterRoutingKey: 'marketing_queue_wait',
            },
            noAck: false,
        },
    });

    await app.startAllMicroservices();

    console.log('Worker Service is consuming from email_queue and reporting_queue');
}

bootstrap();
