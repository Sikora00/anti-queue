# Learning Notes - Queue-Based Email System

This document captures key concepts and patterns learned during the implementation of an asynchronous email processing system with RabbitMQ, NestJS, and resilience patterns.

---

## 1. Circuit Breaker Pattern

### What It Does
The Circuit Breaker acts as a **safety switch** that protects your system from cascading failures. It monitors operations and "trips" when failures exceed a threshold.

### Three States

1. **Closed (Normal)**
   - All requests pass through normally
   - Failures are counted
   - If failure rate exceeds threshold → trips to **Open**

2. **Open (Fast Fail)**
   - **All requests fail immediately** without executing
   - No load on the struggling downstream service
   - Gives the system time to recover
   - Duration: `resetTimeout` (e.g., 10 seconds)

3. **Half-Open (Trial)**
   - After timeout, allows **one test request**
   - If successful → back to **Closed**
   - If fails → back to **Open** for another timeout period

![image](./assets/Learning%20Notes%20-%20Queue-Based%20Email%20System%20-%20Circuit%20Breaker.svg)

### Our Implementation
```typescript
const options = {
  timeout: 3000,              // Max execution time
  errorThresholdPercentage: 20, // Trip at 20% failure rate
  resetTimeout: 10000,        // Stay open for 10s
};
```

**Key Insight**: Circuit Breaker prevents retry storms. When a service is down, instead of hammering it with retries, we fail fast and give it breathing room.

---

## 2. Retry Mechanism with Dead Letter Queue (DLQ)

### The Problem
Transient failures (network blips, temporary service unavailability) should be retried, but we need to avoid infinite loops.

### Our Solution: Wait Queue Pattern

We implemented a **delayed retry mechanism** using RabbitMQ's Dead Letter Exchange (DLX) feature:

![image](./assets/Learning%20Notes%20-%20Queue-Based%20Email%20System%20-%20visual%20selection.svg)

### How It Works

1. **First Attempt**: Message arrives in `email_queue`
2. **On Failure**: Message is `nack`'d (rejected) → goes to `email_queue_wait`
3. **Wait Queue**: Has a 5-second TTL (Time To Live)
4. **After TTL**: Message automatically routes back to `email_queue` for retry
5. **Retry Count**: Tracked via `x-death` header (RabbitMQ adds this automatically)
6. **Max Retries**: After 15 attempts → manually publish to `email_queue_dlq`

### Key Code
```typescript
const headers = originalMsg.properties.headers;
const retryCount = headers['x-death']?.[0]?.count ?? 1;

if (retryCount >= this.maxRetries) {
  // Send to final DLQ
  channel.sendToQueue('email_queue_dlq', originalMsg.content, {
    persistent: true,
    headers: originalMsg.properties.headers,
  });
  ack(); // Remove from main queue
} else {
  nack(); // Send to wait queue for delayed retry
}
```

### Why This Approach?

- **Automatic Delays**: RabbitMQ handles the timing (no manual `setTimeout`)
- **Exponential Backoff**: Could be added by using multiple wait queues with different TTLs
- **Visibility**: `x-death` header tracks retry history
- **No Message Loss**: Failed messages go to DLQ for manual inspection

---

## 3. Queue Topology

### Three Queues

1. **`email_queue`** (Main)
   - Consumed by workers
   - Dead letters to `email_queue_wait` on failure

2. **`email_queue_wait`** (Delay/Retry)
   - **NOT consumed by workers** (important!)
   - Has 5-second TTL
   - Dead letters back to `email_queue`

3. **`email_queue_dlq`** (Final DLQ)
   - Stores messages that exceeded max retries
   - Requires manual intervention

### Critical Setup
```typescript
// Wait Queue - loops back to main
await channel.assertQueue('email_queue_wait', {
  durable: true,
  deadLetterExchange: '',
  deadLetterRoutingKey: 'email_queue', // Loop back!
  messageTtl: 5000,
});

// Main Queue - sends failures to wait
await channel.assertQueue('email_queue', {
  durable: true,
  deadLetterExchange: '',
  deadLetterRoutingKey: 'email_queue_wait',
});
```

**Key Insight**: The wait queue is **never consumed**. It exists purely as a delay mechanism using TTL + DLX.

---

## Further Reading

- [RabbitMQ Dead Letter Exchanges](https://www.rabbitmq.com/dlx.html)
- [Circuit Breaker Pattern (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Opossum Circuit Breaker](https://nodeshift.dev/opossum/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
