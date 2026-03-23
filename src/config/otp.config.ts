import { registerAs } from '@nestjs/config';

function parseCodeLength(raw: string | undefined): number {
  const n = parseInt(raw || '4', 10);
  if (!Number.isFinite(n) || n < 4 || n > 8) return 4;
  return n;
}

function parseExpiryMinutes(raw: string | undefined): number {
  const n = parseInt(raw || '10', 10);
  if (!Number.isFinite(n) || n < 1 || n > 60) return 10;
  return n;
}

export default registerAs('otp', () => ({
  codeLength: parseCodeLength(process.env.OTP_CODE_LENGTH),
  expiryMinutes: parseExpiryMinutes(process.env.OTP_EXPIRY_MINUTES),
}));
