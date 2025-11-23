import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { CircuitBreakerService } from './circuit-breaker.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
          queue: 'email_queue',
          queueOptions: {
            durable: true,
            deadLetterExchange: '',
            deadLetterRoutingKey: 'email_queue_wait', // Route to Wait Queue on failure
          },
        },
      }
    ]),
  ],
  controllers: [EmailController, EmailProcessor],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class EmailModule { }
