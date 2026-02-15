import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OtpService, SmsService],
  exports: [OtpService, SmsService],
})
export class ServicesModule {}
