import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('marketing')
export class MarketingController {
    constructor(@Inject('MARKETING_SERVICE') private readonly client: ClientProxy) { }

    @Post()
    async sendMarketingEmail(@Body() data: { email: string }) {
        this.client.emit('send_marketing_email', data);
        return { message: 'Marketing email queued', data };
    }
}
