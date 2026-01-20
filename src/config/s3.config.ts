import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.DO_SPACES_REGION,
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
  bucket: process.env.DO_SPACES_BUCKET,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  forcePathStyle: true, // Required for DigitalOcean Spaces
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 2097152, // Default 2MB
}));
