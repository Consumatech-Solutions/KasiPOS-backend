import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type SendVerificationCodeResult = {
  success: boolean;
  message: string;
  emailSent: boolean;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey')?.trim();
    this.from = this.configService.get<string>('resend.from')?.trim() ?? '';
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  isResendConfigured(): boolean {
    return Boolean(this.resend && this.from);
  }

  private isDevelopmentMode(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  private softFail(
    message: string,
    logExtra?: string,
  ): SendVerificationCodeResult {
    this.logger.warn(message + (logExtra ? ` ${logExtra}` : ''));
    return {
      success: true,
      emailSent: false,
      message,
    };
  }

  async sendVerificationCode(
    to: string,
    code: string,
  ): Promise<SendVerificationCodeResult> {
    if (!this.isResendConfigured()) {
      if (this.isDevelopmentMode()) {
        this.logger.warn(
          `[DEV] Signup verification code for ${this.maskEmail(to)}: ${code}`,
        );
      }
      return this.softFail(
        'Verification code generated. Email was not sent because Resend is not configured.',
      );
    }

    try {
      const { data, error } = await this.resend!.emails.send({
        from: this.from,
        to: [to],
        subject: 'Your KasiPOS verification code',
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in a few minutes. If you did not request this, you can ignore this email.</p>`,
      });

      if (error) {
        if (this.isDevelopmentMode()) {
          this.logger.warn(
            `[DEV] Signup verification code for ${this.maskEmail(to)}: ${code}`,
          );
        }
        return this.softFail(
          'Verification code generated. Email was not sent due to a Resend error.',
          `Resend error: ${JSON.stringify(error)}`,
        );
      }

      this.logger.log(
        `Verification email sent to ${this.maskEmail(to)} (id: ${data?.id ?? 'n/a'})`,
      );
      return {
        success: true,
        emailSent: true,
        message: 'Email sent successfully',
      };
    } catch (err) {
      if (this.isDevelopmentMode()) {
        this.logger.warn(
          `[DEV] Signup verification code for ${this.maskEmail(to)}: ${code}`,
        );
      }
      return this.softFail(
        'Verification code generated. Email was not sent due to an unexpected error.',
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async sendCreditPaymentReminder(
    to: string,
    subject: string,
    html: string,
  ): Promise<SendVerificationCodeResult> {
    if (!this.isResendConfigured()) {
      return this.softFail(
        'Email was not sent because Resend is not configured.',
        `Credit reminder for ${this.maskEmail(to)}`,
      );
    }

    try {
      const { data, error } = await this.resend!.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        return this.softFail(
          'Email was not sent due to a Resend error.',
          `Credit reminder for ${this.maskEmail(to)}: ${JSON.stringify(error)}`,
        );
      }

      this.logger.log(
        `Credit reminder sent to ${this.maskEmail(to)} (id: ${data?.id ?? 'n/a'})`,
      );
      return {
        success: true,
        emailSent: true,
        message: 'Email sent successfully',
      };
    } catch (err) {
      return this.softFail(
        'Email was not sent due to an unexpected error.',
        `Credit reminder for ${this.maskEmail(to)}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async sendPasswordResetLink(
    to: string,
    resetLink: string,
  ): Promise<SendVerificationCodeResult> {
    if (!this.isResendConfigured()) {
      if (this.isDevelopmentMode()) {
        this.logger.warn(
          `[DEV] Password reset link for ${this.maskEmail(to)}: ${resetLink}`,
        );
      }
      return this.softFail(
        'Password reset link generated. Email was not sent because Resend is not configured.',
      );
    }

    try {
      const { data, error } = await this.resend!.emails.send({
        from: this.from,
        to: [to],
        subject: 'Reset your KasiPOS password',
        html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset your password</a></p><p>This link expires in 10 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
      });

      if (error) {
        if (this.isDevelopmentMode()) {
          this.logger.warn(
            `[DEV] Password reset link for ${this.maskEmail(to)}: ${resetLink}`,
          );
        }
        return this.softFail(
          'Password reset link generated. Email was not sent due to a Resend error.',
          `Resend error: ${JSON.stringify(error)}`,
        );
      }

      this.logger.log(
        `Password reset email sent to ${this.maskEmail(to)} (id: ${data?.id ?? 'n/a'})`,
      );
      return {
        success: true,
        emailSent: true,
        message: 'Email sent successfully',
      };
    } catch (err) {
      if (this.isDevelopmentMode()) {
        this.logger.warn(
          `[DEV] Password reset link for ${this.maskEmail(to)}: ${resetLink}`,
        );
      }
      return this.softFail(
        'Password reset link generated. Email was not sent due to an unexpected error.',
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.length <= 2 ? '*' : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
}
