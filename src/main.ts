import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import * as amqp from 'amqplib';

async function bootstrap() {
  // Assert queues before starting the app to ensure topology is correct
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

  await connection.close();

  const app = await NestFactory.create(AppModule);

  // Only consume from the main queue - DO NOT consume from email_queue_wait
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
      noAck: false, // Manual acknowledgment
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
