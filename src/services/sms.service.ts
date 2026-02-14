import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Sends SMS using the same API keys as the OTP service (same provider/config).
 * Separate from OtpService; only shares credentials via config.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('otp.apiKey');
    this.apiUrl = this.configService.get<string>('otp.apiUrl');
  }

  async send(phoneNumber: string, message: string): Promise<{ success: boolean }> {
    const smsSendUrl = this.configService.get<string>('otp.smsSendUrl');
    const url = smsSendUrl || `${this.apiUrl.replace(/\/otp\/?$/, '')}/sms/send`;
    try {
      this.logger.log(`Sending SMS to ${phoneNumber}`);
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const res = await axios.post(
        url,
        { phone: formattedPhone, message },
        {
          headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
          timeout: 10000,
        },
      );
      if (res.data?.ok !== false && res.status < 400) {
        return { success: true };
      }
      throw new HttpException(res.data?.message || 'Failed to send SMS', HttpStatus.BAD_GATEWAY);
    } catch (error: any) {
      this.logger.error(`SMS send failed: ${error.message}`);
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to send SMS',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException('SMS service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber;
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('0')) {
        formatted = '+27' + formatted.substring(1);
      } else if (!formatted.startsWith('27')) {
        formatted = '+27' + formatted;
      } else {
        formatted = '+' + formatted;
      }
    }
    return formatted;
  }
}
