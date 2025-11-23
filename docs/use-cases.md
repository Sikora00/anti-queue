# Use Cases: Retry Strategies Implementation

This document defines three distinct use cases to demonstrate different RabbitMQ retry strategies within the application.

## 1. Standard Email Notification (Fixed TTL)
**Module**: `EmailModule` (Existing)
**Strategy**: Fixed TTL + DLX
**Scenario**: Sending standard order confirmations.
**Requirements**:
- Queue: `email_queue`
- Wait Queue: `email_queue_wait` (TTL: 5000ms)
- Behavior: Failed emails retry every 5 seconds.
- Goal: Simple, high-performance processing.

## 2. Marketing Campaign (Per-Message TTL)
**Module**: `MarketingModule` (New)
**Strategy**: Per-Message TTL (Manual Publishing)
**Scenario**: Sending bulk marketing emails where "thundering herd" must be avoided.
**Requirements**:
- Queue: `marketing_queue`
- Wait Queue: `marketing_queue_wait` (No fixed TTL)
- Behavior: Failed emails retry with a random delay (e.g., 1s - 10s).
- **Educational Goal**: Demonstrate "Head-of-Line Blocking" (messages waiting for the longest delay in front of them).

## 3. Scheduled Reports (Delayed Message Plugin)
**Module**: `ReportingModule` (New)
**Strategy**: RabbitMQ Delayed Message Plugin
**Scenario**: Generating monthly reports that need to be retried with exponential backoff if data is missing.
**Requirements**:
- Exchange: `reporting_exchange` (Type: `x-delayed-message`)
- Queue: `reporting_queue`
- Behavior: Failed reports retry with exponential backoff (5s, 10s, 20s, 40s...).
- **Infrastructure**: Requires `rabbitmq_delayed_message_exchange` plugin enabled in Docker.
