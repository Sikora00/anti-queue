import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly RABBITMQ_API =
    'http://guest:guest@localhost:15672/api/queues/%2F/email_queue_wait';
  private readonly THRESHOLD = 10; // Alert if more than 10 messages in queue
  private interval: any;

  onModuleInit() {
    // Start polling every 5 seconds
    this.interval = setInterval(() => this.checkQueueStatus(), 5000);
  }

  onModuleDestroy() {
    clearInterval(this.interval);
  }

  async checkQueueStatus() {
    try {
      const response = await axios.get(this.RABBITMQ_API);
      const messages = response.data.messages;
      const messagesReady = response.data.messages_ready;
      const messagesUnacknowledged = response.data.messages_unacknowledged;

      this.logger.log(
        `Queue Status: Total=${messages}, Ready=${messagesReady}, Unacked=${messagesUnacknowledged}`,
      );

      if (messages > this.THRESHOLD) {
        this.logger.warn(
          `ALERT: Queue size (${messages}) exceeded threshold (${this.THRESHOLD})!`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to fetch queue status', error.message);
    }
  }
}
