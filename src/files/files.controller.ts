import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a file to S3 storage. Returns the public URL of the uploaded file. Requires authentication.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (max size from MAX_FILE_SIZE env, default 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      example: {
        url: 'https://ai-mobile.sfo3.digitaloceanspaces.com/products/uuid-here.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file type or file exceeds MAX_FILE_SIZE limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const url = await this.filesService.uploadFile(file);
    return { url };
  }

  @Post('upload/product-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a product image',
    description: 'Upload a product image to S3 storage. Returns the public URL of the uploaded file. Requires authentication.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Product image file to upload (max size from MAX_FILE_SIZE env, default 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product image uploaded successfully',
    schema: {
      example: {
        url: 'https://ai-mobile.sfo3.digitaloceanspaces.com/products/uuid-here.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file type or file exceeds MAX_FILE_SIZE limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const url = await this.filesService.uploadProductImage(file);
    return { url };
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file from S3 storage by its URL. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        message: 'File deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid URL or file not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteFile(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }
    await this.filesService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}
