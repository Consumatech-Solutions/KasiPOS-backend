import { registerAs } from '@nestjs/config';

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY || '',
  from: process.env.RESEND_FROM || 'KasiPOS <onboarding@resend.dev>',
  enabledInDevelopment: process.env.RESEND_ENABLED_IN_DEVELOPMENT === 'true',
}));
