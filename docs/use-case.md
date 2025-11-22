# Queuing and Asynchronous Processing

**Scenario**: You have an endpoint for sending order confirmation emails that currently works synchronously.

**Task**: Redesign the system to handle high traffic:
1. Implement a queue (RabbitMQ or similar) to handle email sending requests
2. Create separate worker services consuming messages from the queue
3. Add a retry mechanism for failed operations
4. Implement a dead-letter queue for messages that failed to process
5. Add queue status monitoring and alerting when thresholds are exceeded

**Extension**: Implement the Circuit Breaker pattern to protect against system overload.
