import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * SMS sending service.
 * WinSMS (South Africa) HTTP API (batchmessage.asp) with username/password.
 * @see https://api.winsms.co.za/api/httpdocs/
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async send(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendSouthAfricanSms(phoneNumber, message);
  }

  async sendSouthAfricanSms(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; message: string }> {
    const apiUrl = 'https://api.winsms.co.za/api/batchmessage.asp';
    const username = this.configService.get<string>('sms.productionConfig.winsms.username');
    const password = this.configService.get<string>('sms.productionConfig.winsms.password');

    if (!username || !password) {
      throw new BadRequestException('WinSMS credentials are not configured');
    }

    try {
      const numbers = this.toWinSMSNumber(phoneNumber);
      const response = await axios.get(apiUrl, {
        params: {
          user: username,
          password: password,
          message: message,
          numbers: numbers,
        },
        timeout: 15000,
      });

      this.logger.log(
        `SMS sent successfully to ${this.maskPhone(phoneNumber)}`,
      );
      this.logger.debug(`API Response: ${JSON.stringify(response.data)}`);

      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      this.logger.error(
        'Failed to send SMS:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      if ((error as { response?: unknown }).response) {
        this.logger.debug(
          `API error response: ${JSON.stringify((error as { response: unknown }).response)}`,
        );
      }
      return { success: false, message: 'Failed to send SMS' };
    }
  }

  private maskPhone(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return digits.slice(0, 3) + '***' + digits.slice(-4);
  }

  /**
   * WinSMS expects South African numbers as 27XXXXXXXXX (no + or leading zero).
   */
  private toWinSMSNumber(phoneNumber: string): string {
    let s = phoneNumber.replace(/\s/g, '');
    if (s.startsWith('+')) s = s.slice(1);
    if (s.startsWith('0')) s = '27' + s.slice(1);
    if (!s.startsWith('27')) s = '27' + s;
    return s;
  }
}
