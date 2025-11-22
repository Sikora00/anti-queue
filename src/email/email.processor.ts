import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CircuitBreakerService } from './circuit-breaker.service';

@Controller()
export class EmailProcessor {
  private maxRetries = 15;
  constructor(private readonly cbService: CircuitBreakerService) { }

  @EventPattern('send_email')
  async handleEmail(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const headers = originalMsg.properties.headers;
    const ack = () => channel.ack(originalMsg);
    const nack = () => channel.nack(originalMsg, false, false);

    if (!headers['x-death']) {
      await this.handleFirstExecution(
        data.email,
        nack,
        ack
      );
    } else {
      const retryCount = headers['x-death'][0].count ?? 1;

      await this.retryExecution(
        data,
        retryCount,
        channel,
        originalMsg,
        nack,
        ack
      );
    }
  }

  private async retryExecution(
    data: any,
    attempt: number,
    channel: any,
    originalMsg: any,
    nack: () => void,
    ack: () => void
  ) {
    console.log(`Processing email retry for: ${data.email}, attempt: ${attempt}`);
    try {
      await this.cbService.execute(data.email, attempt);
      ack();
    } catch (error) {
      const nextAttempt = attempt + 1;
      console.error(`Failed to execute retry execution for ${data.email}: ${error}`);
      if (nextAttempt >= this.maxRetries) {
        console.error(`Max retries (${this.maxRetries}) reached for ${data.email}. Sending to DLQ.`);

        // Publish to DLQ
        channel.sendToQueue('email_queue_dlq', originalMsg.content, {
          persistent: true,
          headers: originalMsg.properties.headers,
        });

        // Ack the original message to remove it from the main queue
        ack();
      } else {
        console.error(`Attempt ${nextAttempt} failed for ${data.email}. Sending to Wait Queue.`);
        nack(); // Send to Wait Queue (delayed retry)
      }
    }
  }

  private async handleFirstExecution(email: string, nack: () => void, ack: () => void) {
    try {
      console.log(`Processing email for: ${email}, attempt: 1`);
      await this.cbService.execute(email, 1);
      ack();
    } catch (error) {
      console.error(`Failed to execute first execution for ${email}: ${error}`);
      nack();

    }
  }
}
