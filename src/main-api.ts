import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Start only the HTTP server
    // RabbitMQ client is registered in EmailModule for publishing messages
    await app.listen(3000);

    console.log('API Service is running on: http://localhost:3000');
}

bootstrap();
