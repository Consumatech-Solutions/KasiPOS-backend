import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucket: string;
  private maxFileSize: number;

  constructor(private configService: ConfigService) {
    const s3Config = this.configService.get('s3');

    this.s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      endpoint: s3Config.endpoint,
      forcePathStyle: s3Config.forcePathStyle,
    });

    this.bucket = s3Config.bucket;
    this.maxFileSize = s3Config.maxFileSize;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type (images only)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    // Validate file size using MAX_FILE_SIZE from env
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(`File size exceeds ${maxSizeMB}MB limit.`);
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make file publicly accessible
      });

      await this.s3Client.send(command);

      // Return the public URL for DigitalOcean Spaces
      // Format: https://bucket.region.digitaloceanspaces.com/path/to/file
      const endpoint = this.configService.get<string>('s3.endpoint');
      const endpointHost = endpoint
        .replace('https://', '')
        .replace('http://', '');
      return `https://${this.bucket}.${endpointHost}/${fileName}`;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the key from the DigitalOcean Spaces URL
      // URL format: https://bucket.region.digitaloceanspaces.com/folder/filename.ext
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);

      // Remove bucket name from path if present
      const key = pathParts.join('/');

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'products');
  }
}
