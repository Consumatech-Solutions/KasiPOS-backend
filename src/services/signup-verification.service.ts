import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt, timingSafeEqual } from 'crypto';

export type PendingSignup = {
  email: string;
  name: string;
  storeName: string;
  phoneNumber?: string;
  password: string;
  code: string;
  expiresAt: number;
};

/** Fixed signup code when NODE_ENV=development (local testing without email). */
export const DEV_SIGNUP_VERIFICATION_CODE = '123456';

@Injectable()
export class SignupVerificationService {
  private readonly logger = new Logger(SignupVerificationService.name);
  private readonly store = new Map<string, PendingSignup>();

  constructor(private readonly configService: ConfigService) {}

  private isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  createPending(
    data: Omit<PendingSignup, 'code' | 'expiresAt'>,
  ): { code: string } {
    const codeLength = this.configService.get<number>('otp.codeLength') ?? 6;
    const expiryMinutes =
      this.configService.get<number>('otp.expiryMinutes') ?? 10;

    const code = this.isDevelopment()
      ? DEV_SIGNUP_VERIFICATION_CODE
      : this.generateNumericCode(codeLength);

    if (this.isDevelopment()) {
      this.logger.log(
        `Development mode (NODE_ENV=development): signup verification code is static (${DEV_SIGNUP_VERIFICATION_CODE})`,
      );
    }

    const key = this.normalizeEmail(data.email);
    const expiresAt = Date.now() + expiryMinutes * 60_000;

    this.store.set(key, {
      ...data,
      email: key,
      code,
      expiresAt,
    });

    return { code };
  }

  verifyAndConsume(email: string, code: string): PendingSignup | null {
    const key = this.normalizeEmail(email);
    const entry = this.store.get(key);

    if (!entry) {
      this.logger.warn(`Signup verify: no pending for ${this.maskEmail(key)}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.warn(`Signup verify: expired for ${this.maskEmail(key)}`);
      return null;
    }

    const normalized = code.replace(/\s/g, '');
    if (!this.codesEqual(normalized, entry.code)) {
      this.logger.warn(`Signup verify: invalid code for ${this.maskEmail(key)}`);
      return null;
    }

    this.store.delete(key);
    return entry;
  }

  private generateNumericCode(length: number): string {
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

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    return `${local.slice(0, 2)}***@${domain}`;
  }
}
