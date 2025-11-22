import { Injectable } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  public breaker: CircuitBreaker;

  constructor() {
    const options = {
      timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
      errorThresholdPercentage: 20, // When 20% of requests fail, trip the circuit
      resetTimeout: 10000, // After 10 seconds, try again.
    };
    this.breaker = new CircuitBreaker(this.sendEmailLogic.bind(this), options);
    // this.breaker.fallback(() =>
    // console.log('Circuit open or failed - fallback triggered'),
    // );
  }

  private async sendEmailLogic(email: string, attempt: number) {
    console.log('Processing email for:', email);
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100)); // Faster processing


    if (attempt < 3) {
      throw new Error('Random email sending failure');
    }

    return this.onEmailSent(email);
  }

  onEmailSent(email: string) {
    console.log('Email sent successfully to:', email);
    return true;
  }

  async execute(email: string, attempt: number) {
    return this.breaker.fire(email, attempt);
  }
}
