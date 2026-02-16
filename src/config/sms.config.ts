import { registerAs } from '@nestjs/config';

/**
 * SMS provider configuration.
 * WinSMS (South Africa): https://www.winsms.co.za/api/restdocs/
 * Set WINSMS_API_KEY to enable WinSMS. Optionally set WINSMS_API_URL to override the default REST base URL.
 */
export default registerAs('sms', () => ({
  winsms: {
    apiKey: process.env.WINSMS_API_KEY || '',
    apiUrl:
      process.env.WINSMS_API_URL ||
      'https://www.winsms.co.za/api/rest/v1',
  },
  // Legacy: optional URL for sending SMS via previous provider (e.g. OTP provider)
  fallbackSendUrl: process.env.OTP_SMS_SEND_URL || '',
  fallbackApiKey: process.env.OTP_API_KEY || '',
}));
