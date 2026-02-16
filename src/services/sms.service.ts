import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * SMS sending service.
 * Uses WinSMS (South Africa) when WINSMS_API_KEY is set; otherwise falls back to
 * optional OTP provider SMS URL if configured.
 * @see https://www.winsms.co.za/api/restdocs/
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly http: AxiosInstance = axios.create({
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  constructor(private configService: ConfigService) {}

  /**
   * Send an SMS to one recipient.
   * Phone number is normalized to South African format (27...) when using WinSMS.
   */
  async send(phoneNumber: string, message: string): Promise<{ success: boolean }> {
    const winsmsKey = this.configService.get<string>('sms.winsms.apiKey');
    if (winsmsKey) {
      return this.sendViaWinSMS(phoneNumber, message, winsmsKey);
    }
    const fallbackUrl = this.configService.get<string>('sms.fallbackSendUrl');
    const fallbackKey = this.configService.get<string>('sms.fallbackApiKey');
    if (fallbackUrl && fallbackKey) {
      return this.sendViaFallback(phoneNumber, message, fallbackUrl, fallbackKey);
    }
    this.logger.warn(
      'No SMS provider configured (WINSMS_API_KEY or OTP_SMS_SEND_URL + OTP_API_KEY). Skipping send.',
    );
    return { success: true };
  }

  private async sendViaWinSMS(
    phoneNumber: string,
    message: string,
    apiKey: string,
  ): Promise<{ success: boolean }> {
    const baseUrl = this.configService.get<string>('sms.winsms.apiUrl');
    const url = `${baseUrl?.replace(/\/$/, '')}/sms/outgoing/send`;
    const mobileNumber = this.toWinSMSNumber(phoneNumber);

    try {
      this.logger.log(`Sending SMS via WinSMS to ${mobileNumber}`);
      const res = await this.http.post(
        url,
        {
          message,
          recipients: [{ mobileNumber }],
        },
        {
          headers: {
            Authorization: apiKey,
          },
        },
      );

      const data = res.data as WinSMSSendResponse;
      const accepted =
        data?.recipients?.[0]?.accepted ?? (res.status >= 200 && res.status < 300);
      if (accepted) {
        return { success: true };
      }
      const errMsg =
        data?.recipients?.[0]?.acceptError ||
        data?.message ||
        data?.errorMessage ||
        'WinSMS rejected the message';
      this.logger.error(`WinSMS error: ${errMsg}`);
      throw new HttpException(errMsg, HttpStatus.BAD_GATEWAY);
    } catch (error: any) {
      this.logger.error(`WinSMS send failed: ${error.message}`);
      if (error.response?.data) {
        const d = error.response.data as { message?: string; errorMessage?: string };
        throw new HttpException(
          d.message || d.errorMessage || 'Failed to send SMS',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'SMS service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async sendViaFallback(
    phoneNumber: string,
    message: string,
    url: string,
    apiKey: string,
  ): Promise<{ success: boolean }> {
    const formatted = this.formatPhoneNumber(phoneNumber);
    try {
      this.logger.log(`Sending SMS via fallback to ${formatted}`);
      const res = await this.http.post(
        url,
        { phone: formatted, message },
        { headers: { 'x-api-key': apiKey } },
      );
      if (res.data?.ok !== false && res.status < 400) {
        return { success: true };
      }
      throw new HttpException(
        res.data?.message || 'Failed to send SMS',
        HttpStatus.BAD_GATEWAY,
      );
    } catch (error: any) {
      this.logger.error(`SMS send failed: ${error.message}`);
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to send SMS',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        'SMS service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
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

/** WinSMS REST API send response (simplified). */
interface WinSMSSendResponse {
  recipients?: Array<{
    accepted?: boolean;
    acceptError?: string;
    apiMessageId?: string | null;
    mobileNumber?: string;
  }>;
  message?: string;
  errorMessage?: string;
}
