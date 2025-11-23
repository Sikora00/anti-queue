import { Controller, Inject } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, ClientProxy } from '@nestjs/microservices';
import { ReportingService } from './reporting.service';

@Controller()
export class ReportingProcessor {
    constructor(
        private readonly reportingService: ReportingService,
        @Inject('REPORTING_SERVICE') private readonly client: ClientProxy,
    ) { }

    @EventPattern('generate_report')
    async handleReportGeneration(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const headers = originalMsg.properties.headers || {};
        const retryCount = headers['x-retry-count'] || 0;

        try {
            console.log(`Processing report ${data.reportId}. Attempt: ${retryCount + 1}`);
            await this.reportingService.generate(data.reportId);
            channel.ack(originalMsg);
        } catch (error) {
            console.error(`Failed to generate report ${data.reportId}: ${error.message}`);

            if (retryCount >= 5) {
                console.error(`Max retries reached for report ${data.reportId}. Giving up.`);
                channel.ack(originalMsg); // Or send to DLQ
                return;
            }

            const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s, 8s...
            console.log(`Scheduling retry #${retryCount + 1} in ${delay}ms`);

            // Republish with x-delay header
            // We need to publish to the special exchange 'reporting_exchange' which we assume is set up as x-delayed-message
            // For simplicity in NestJS RMQ, we can often just publish to the queue/exchange with the header
            // BUT, the exchange MUST be of type x-delayed-message.

            // To make this work properly with the plugin, we need to assert the exchange as x-delayed-message.
            // Since NestJS creates queues/exchanges automatically, we might need to configure it or do it manually here.

            // Let's try to publish to the same queue but with the x-delay header. 
            // Note: The plugin requires publishing to an exchange of type x-delayed-message.
            // If we just publish to the default exchange or a direct exchange, x-delay is ignored.

            // We will use the client to emit the message again, but we need to pass options.
            // NestJS ClientProxy.emit doesn't easily expose AMQP options like headers for the *publish* call directly in a way that overrides everything easily for delayed exchange routing without some setup.

            // A more robust way using the channel directly:
            const exchangeName = 'reporting_exchange';
            const routingKey = 'reporting_queue';

            // Ensure exchange exists (idempotent)
            await channel.assertExchange(exchangeName, 'x-delayed-message', {
                arguments: { 'x-delayed-type': 'direct' },
                durable: true
            });

            // Ensure queue is bound
            await channel.bindQueue('reporting_queue', exchangeName, 'reporting_queue');

            channel.publish(exchangeName, 'reporting_queue', originalMsg.content, {
                headers: {
                    'x-delay': delay,
                    'x-retry-count': retryCount + 1,
                },
                persistent: true,
            });

            channel.ack(originalMsg);
        }
    }
}
