# Anti-Queue - Email Queue Processing System

A NestJS-based email queue processing system with RabbitMQ, featuring separate API and worker services for independent scaling.

## Architecture

This application is split into two independently scalable services:

- **API Service** (`main-api.ts`) - HTTP server that receives email requests and publishes them to RabbitMQ
- **Worker Service** (`main-worker.ts`) - Queue consumer that processes email messages from RabbitMQ

This separation allows you to:
- Scale workers independently based on queue load
- Deploy services separately
- Run multiple worker instances for parallel processing

## Features

- ✅ RabbitMQ message queue for async email processing
- ✅ Delayed retry mechanism with exponential backoff
- ✅ Dead-letter queue (DLQ) for failed messages
- ✅ Circuit breaker pattern for fault tolerance
- ✅ Queue monitoring and alerting
- ✅ Independent service scaling

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (for running RabbitMQ and PostgreSQL)
- PM2 (optional, for production deployment)

## Installation

```bash
npm install
```

## Running the Application

### Development Mode (Separate Terminals)

**Terminal 1 - Start Infrastructure:**
```bash
docker-compose up postgres rabbitmq
```

**Terminal 2 - Start API Service:**
```bash
npm run start:api:dev
```

**Terminal 3 - Start Worker Service:**
```bash
npm run start:worker:dev
```

### Development Mode (Single Command with PM2)

```bash
# Build the application first
npm run build

# Start both services with PM2
npm run start:pm2:dev
```

### Production Mode with Docker Compose

```bash
# Start all services (API + 1 worker)
docker-compose up

# Scale workers independently
docker-compose up --scale worker=5
```

### Production Mode with PM2

```bash
# Build the application
npm run build

# Start with PM2 (1 API + 2 workers by default)
npm run start:pm2

# Scale workers
pm2 scale worker 5

# View status
pm2 status

# View logs
pm2 logs
```

## Available Scripts

### Development
- `npm run start:api:dev` - Start API service in watch mode
- `npm run start:worker:dev` - Start worker service in watch mode

### Production
- `npm run build` - Build the application
- `npm run start:api` - Start API service
- `npm run start:worker` - Start worker service
- `npm run start:pm2` - Start both services with PM2
- `npm run start:pm2:dev` - Start both services with PM2 in watch mode

### Testing
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

## API Endpoints

### Send Email
```bash
POST http://localhost:3000/email/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Queue Configuration

The system uses three RabbitMQ queues:

1. **email_queue** - Main queue for processing emails
2. **email_queue_wait** - Delay queue for retries (5 second TTL)
3. **email_queue_dlq** - Dead-letter queue for permanently failed messages

Messages are retried up to 15 times with a 5-second delay between retries.

## Scaling Workers

### With Docker Compose
```bash
docker-compose up --scale worker=5
```

### With PM2
```bash
pm2 scale worker 5
```

### Manual (Multiple Processes)
```bash
# Terminal 1
npm run start:worker

# Terminal 2
npm run start:worker

# Terminal 3
npm run start:worker
```

## Monitoring

- RabbitMQ Management UI: http://localhost:15672 (guest/guest)
- API Health: http://localhost:3000

## Project Structure

```
src/
├── main-api.ts           # API service entry point
├── main-worker.ts        # Worker service entry point
├── app.module.ts         # Main application module
├── email/
│   ├── email.controller.ts    # HTTP endpoint
│   ├── email.processor.ts     # Queue consumer
│   ├── email.module.ts        # Email module
│   └── circuit-breaker.service.ts
└── monitoring.service.ts
```

## License

MIT

