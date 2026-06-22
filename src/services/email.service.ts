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

  async sendVerificationCode(
    to: string,
    code: string,
  ): Promise<SendVerificationCodeResult> {
    if (!this.isResendConfigured()) {
      this.logger.warn(
        'Resend is not configured (RESEND_API_KEY and/or RESEND_FROM missing in .env). ' +
          'Signup verification email was not sent.',
      );
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.warn(
          `[DEV ONLY] Signup verification code for ${this.maskEmail(to)}: ${code}`,
        );
      }
      return {
        success: true,
        emailSent: false,
        message:
          'Verification code generated. Email was not sent because Resend is not configured.',
      };
    }

    const { data, error } = await this.resend!.emails.send({
      from: this.from,
      to: [to],
      subject: 'Your KasiPOS verification code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in a few minutes. If you did not request this, you can ignore this email.</p>`,
    });

    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      return {
        success: false,
        emailSent: false,
        message: 'Failed to send email',
      };
    }

    this.logger.log(
      `Verification email sent to ${this.maskEmail(to)} (id: ${data?.id ?? 'n/a'})`,
    );
    return {
      success: true,
      emailSent: true,
      message: 'Email sent successfully',
    };
  }

  async sendCreditPaymentReminder(
    to: string,
    subject: string,
    html: string,
  ): Promise<SendVerificationCodeResult> {
    if (!this.isResendConfigured()) {
      this.logger.warn(
        'Resend is not configured. Credit payment reminder email was not sent to ' +
          this.maskEmail(to),
      );
      return {
        success: true,
        emailSent: false,
        message: 'Email was not sent because Resend is not configured.',
      };
    }

    const { data, error } = await this.resend!.emails.send({
      from: this.from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      this.logger.error(
        `Resend credit reminder error for ${this.maskEmail(to)}: ${JSON.stringify(error)}`,
      );
      return {
        success: false,
        emailSent: false,
        message: 'Failed to send email',
      };
    }

    this.logger.log(
      `Credit reminder sent to ${this.maskEmail(to)} (id: ${data?.id ?? 'n/a'})`,
    );
    return {
      success: true,
      emailSent: true,
      message: 'Email sent successfully',
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.length <= 2 ? '*' : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
}
