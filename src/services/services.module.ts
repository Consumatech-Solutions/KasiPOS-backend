import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { WelcomeSmsService } from './welcome-sms.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OtpService, SmsService, WelcomeSmsService],
  exports: [OtpService, SmsService, WelcomeSmsService],
})
export class ServicesModule {}
