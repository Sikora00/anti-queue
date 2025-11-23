import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class MarketingProcessor {
    @EventPattern('send_marketing_email')
    async handleMarketingEmail(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const headers = originalMsg.properties.headers;

        try {
            console.log(`Processing marketing email for: ${data.email}`);

            // Simulate random failure
            if (Math.random() < 0.7) {
                throw new Error('Random marketing email failure');
            }

            console.log(`Marketing email sent successfully to: ${data.email}`);
            channel.ack(originalMsg);
        } catch (error) {
            console.error(`Failed to send marketing email to ${data.email}: ${error.message}`);

            const retryCount = headers['x-death'] ? headers['x-death'][0].count : 0;

            if (retryCount >= 5) {
                console.error(`Max retries reached for ${data.email}. Dropping message.`);
                channel.ack(originalMsg); // Or send to DLQ
                return;
            }

            // Calculate random delay between 1s and 10s
            const delay = Math.floor(Math.random() * 9000) + 1000;
            console.log(`Retrying ${data.email} in ${delay}ms (Attempt ${retryCount + 1})`);

            // Publish to Wait Queue with per-message expiration
            // We need to manually publish to the wait queue because nack() would use default queue settings or DLX
            // But here we want to set a specific expiration for THIS message

            // Note: In this specific pattern (Per-Message TTL), we usually publish to the Wait Queue manually
            // and ACK the original message so it doesn't stay in the main queue.

            channel.sendToQueue('marketing_queue_wait', originalMsg.content, {
                expiration: delay, // Per-message TTL
                headers: headers,
            });

            channel.ack(originalMsg);
        }
    }
}
