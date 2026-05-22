import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { WelcomeSmsService } from './welcome-sms.service';
import { EmailService } from './email.service';
import { SignupVerificationService } from './signup-verification.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    OtpService,
    SmsService,
    WelcomeSmsService,
    EmailService,
    SignupVerificationService,
  ],
  exports: [
    OtpService,
    SmsService,
    WelcomeSmsService,
    EmailService,
    SignupVerificationService,
  ],
})
export class ServicesModule {}
