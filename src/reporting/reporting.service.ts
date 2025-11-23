import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportingService {
    async generate(reportId: string): Promise<void> {
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulate random failure (80% failure rate to demonstrate retries)
        if (Math.random() < 0.8) {
            throw new Error(`Random failure generating report ${reportId}`);
        }

        console.log(`Successfully generated report ${reportId}`);
    }
}
