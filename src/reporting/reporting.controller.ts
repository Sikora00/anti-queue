import { Controller, Post, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('reporting')
export class ReportingController {
    constructor(
        @Inject('REPORTING_SERVICE') private readonly client: ClientProxy,
    ) { }

    @Post('generate')
    async generateReport() {
        const reportId = Math.random().toString(36).substring(7);
        console.log(`Requesting report generation: ${reportId}`);

        // Publish to the delayed exchange
        // Note: We are publishing to the queue directly here for simplicity in this setup,
        // but for the delayed exchange to work as intended with routing keys, 
        // we usually publish to the exchange. 
        // However, the NestJS RMQ client abstracts this. 
        // To use the delayed exchange specifically, we need to ensure the exchange is asserted correctly.
        // For this demo, we'll rely on the processor to handle the re-publishing with x-delay.
        // The initial publish is immediate.

        this.client.emit('generate_report', { reportId });
        return { message: 'Report generation requested', reportId };
    }
}
