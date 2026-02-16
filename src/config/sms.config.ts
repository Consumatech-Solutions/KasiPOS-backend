import { registerAs } from '@nestjs/config';

/**
 * SMS provider configuration.
 * WinSMS (South Africa) HTTP API: https://api.winsms.co.za/api/httpdocs/
 * Set WINSMS_USERNAME and WINSMS_PASSWORD for batchmessage.asp.
 */
export default registerAs('sms', () => ({
  productionConfig: {
    winsms: {
      username: process.env.WINSMS_USERNAME || '',
      password: process.env.WINSMS_PASSWORD || '',
    },
  },
}));
