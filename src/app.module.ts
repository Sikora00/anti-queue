import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [EmailModule],
  controllers: [AppController],
  providers: [AppService, MonitoringService],
})
export class AppModule {}
