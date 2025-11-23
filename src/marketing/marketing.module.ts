import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MarketingController } from './marketing.controller';
import { MarketingProcessor } from './marketing.processor';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'MARKETING_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
                    queue: 'marketing_queue',
                    queueOptions: {
                        durable: true,
                        deadLetterExchange: '',
                        deadLetterRoutingKey: 'marketing_queue_wait',
                    },
                },
            },
        ]),
    ],
    controllers: [MarketingController, MarketingProcessor],
})
export class MarketingModule { }
