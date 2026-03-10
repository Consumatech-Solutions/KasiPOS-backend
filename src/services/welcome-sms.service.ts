import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';

/**
 * Sends welcome SMS to new customers.
 * Same structure as SmsService but dedicated to a single welcome message.
 */
@Injectable()
export class WelcomeSmsService {
  private readonly logger = new Logger(WelcomeSmsService.name);

  constructor(private readonly smsService: SmsService) {}

  /**
   * Sends a welcome SMS to the given phone number.
   * Optionally personalizes with the customer name.
   */
  async sendWelcome(
    phoneNumber: string,
    customerName?: string,
  ): Promise<{ success: boolean; message: string }> {
    const welcomeMessage = this.buildWelcomeMessage(customerName);
    return this.smsService.send(phoneNumber, welcomeMessage);
  }

  private buildWelcomeMessage(customerName?: string): string {
    const greeting = customerName
      ? `Hi ${customerName}, welcome!`
      : 'Hi, welcome!';
    return `${greeting} Thank you for joining us. We're glad to have you.`;
  }
}
