import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { ReportingModule } from './reporting/reporting.module';
import { MonitoringService } from './monitoring.service';

import { MarketingModule } from './marketing/marketing.module';

@Module({
  imports: [EmailModule, MarketingModule, ReportingModule],
  controllers: [AppController],
  providers: [AppService, MonitoringService],
})
export class AppModule { }
