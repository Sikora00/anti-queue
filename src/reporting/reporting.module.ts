import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReportingController } from './reporting.controller';
import { ReportingProcessor } from './reporting.processor';
import { ReportingService } from './reporting.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'REPORTING_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
                    queue: 'reporting_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
        ]),
    ],
    controllers: [ReportingController, ReportingProcessor],
    providers: [ReportingService],
})
export class ReportingModule { }
