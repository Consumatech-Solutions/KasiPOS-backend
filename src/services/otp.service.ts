import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('otp.apiUrl');
    this.apiKey = this.configService.get<string>('otp.apiKey');

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      timeout: 10000,
    });
  }

  async sendOtp(phoneNumber: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      this.logger.log(`Sending OTP to ${phoneNumber}`);

      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await this.httpClient.post('/generate', {
        phone: formattedPhone,
        type: 'numeric',
        length: 4,
        countryCode: 'ZA',
        message: 'Your OTP is {otp} for SOMSA Marketplace.',
      });

      if (response.data.ok === true) {
        return {
          success: true,
          messageId: response.data.expiresAt, // Use expiresAt as identifier if needed
        };
      }

      throw new HttpException('Failed to send OTP', HttpStatus.BAD_GATEWAY);
    } catch (error) {
      this.logger.error(`Error sending OTP: ${error.message}`, error.stack);

      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to send OTP',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        'OTP service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      // If phone starts with 0, replace with +27, otherwise add +27
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+27' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('27')) {
        formattedPhone = '+27' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }
    return formattedPhone;
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    try {
      this.logger.log(`Verifying OTP for ${phoneNumber}`);

      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await this.httpClient.post('/verify', {
        phone: formattedPhone,
        otp: code,
      });

      return response.data.ok === true;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          this.logger.warn(
            `OTP verification failed for ${phoneNumber}: ${error.response.data?.message || 'Invalid OTP code'}`,
          );
          return false; // Invalid code
        }
        this.logger.error(
          `OTP verification error: ${error.response.data?.message || 'Failed to verify OTP'}`,
        );
        throw new HttpException(
          error.response.data?.message || 'Failed to verify OTP',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.error(`OTP service unavailable: ${error.message}`);
      throw new HttpException(
        'OTP service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

