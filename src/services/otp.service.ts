import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt, timingSafeEqual } from 'crypto';
import { SmsService } from './sms.service';

type OtpEntry = { code: string; expiresAt: number };

/**
 * OTP generation and verification using WinSMS for delivery (same HTTP API as {@link SmsService}).
 * Codes are stored in memory (single process); set OTP_CODE_LENGTH and OTP_EXPIRY_MINUTES via config.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly store = new Map<string, OtpEntry>();

  constructor(
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async sendOtp(phoneNumber: string): Promise<{ success: boolean; messageId?: string }> {
    const codeLength = this.configService.get<number>('otp.codeLength') ?? 4;
    const expiryMinutes = this.configService.get<number>('otp.expiryMinutes') ?? 10;

    const code = this.generateNumericOtp(codeLength);
    const key = this.phoneKey(phoneNumber);
    const expiresAt = Date.now() + expiryMinutes * 60_000;

    this.store.set(key, { code, expiresAt });

    const message = `Your verification code is ${code}.`;
    const smsResult = await this.smsService.send(phoneNumber, message);

    if (!smsResult.success) {
      this.store.delete(key);
      return { success: false };
    }

    this.logger.log(`OTP sent via WinSMS to ${this.maskPhone(phoneNumber)}`);
    return { success: true, messageId: String(expiresAt) };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const key = this.phoneKey(phoneNumber);
    const entry = this.store.get(key);

    if (!entry) {
      this.logger.warn(`OTP verify: no pending code for ${this.maskPhone(phoneNumber)}`);
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.warn(`OTP verify: expired for ${this.maskPhone(phoneNumber)}`);
      return false;
    }

    const normalized = code.replace(/\s/g, '');
    if (!this.codesEqual(normalized, entry.code)) {
      this.logger.warn(`OTP verify: invalid code for ${this.maskPhone(phoneNumber)}`);
      return false;
    }

    this.store.delete(key);
    this.logger.log(`OTP verified for ${this.maskPhone(phoneNumber)}`);
    return true;
  }

  private generateNumericOtp(length: number): string {
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  private codesEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  }

  private phoneKey(phoneNumber: string): string {
    let d = phoneNumber.replace(/\D/g, '');
    if (d.startsWith('0')) d = '27' + d.slice(1);
    if (!d.startsWith('27')) d = '27' + d;
    return d;
  }

  private maskPhone(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return digits.slice(0, 3) + '***' + digits.slice(-4);
  }
}
