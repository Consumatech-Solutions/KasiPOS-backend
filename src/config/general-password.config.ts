import { registerAs } from '@nestjs/config';

export default registerAs('generalPassword', () => ({
  hash: process.env.GENERAL_PASSWORD_HASH || null,
}));
