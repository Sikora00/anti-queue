import { Controller, Post, Body, Inject, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CircuitBreakerService } from './circuit-breaker.service';

@Controller('email')
export class EmailController {
  constructor(
    @Inject('EMAIL_SERVICE') private readonly client: ClientProxy,
    private readonly cbService: CircuitBreakerService,
  ) { }

  @Post('send')
  async sendEmail(@Body() data: any) {
    this.client.emit('send_email', data);
    return { message: 'Email request queued', data };
  }

}
