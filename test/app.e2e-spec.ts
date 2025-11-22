import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from './../src/email/circuit-breaker.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Connect microservice to share the same instance/context
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://guest:guest@localhost:5672'],
        queue: 'email_queue',
        queueOptions: {
          durable: true,
          deadLetterExchange: '',
          deadLetterRoutingKey: 'email_queue_wait',
        },
        noAck: false,
      },
    });

    await app.startAllMicroservices();
    await app.listen(0)
  });

  afterAll(async () => {
    // Wait a bit for pending operations to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await app.close();
  });

  it('should retry on failure and eventually succeed', async () => {
    const cbService = app.get(CircuitBreakerService);
    // Spy on the execute method to count calls
    const executeSpy = jest.spyOn(cbService, 'onEmailSent');

    const emails = new Array(30).fill(null).map((_, i) => `retry-test-${i}@example.com`);
    const agent = request(app.getHttpServer())

    await Promise.all(emails.map(email => agent
      .post('/email/send')
      .send({ email })
      .expect(201)));


    //wait 30s
    await new Promise(resolve => setTimeout(resolve, 30_000));
    emails.forEach(email => expect(executeSpy).toHaveBeenCalledWith(email));
  }, 40_000);
});
