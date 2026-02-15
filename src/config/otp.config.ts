import { registerAs } from '@nestjs/config';

export default registerAs('otp', () => ({
  apiUrl: process.env.OTP_API_URL || 'https://otp.ai-mobile.africa/v1/otp',
  apiKey: process.env.OTP_API_KEY || '',
  smsSendUrl: process.env.OTP_SMS_SEND_URL || '', // Optional: URL for sending custom SMS (e.g. same provider)
}));

