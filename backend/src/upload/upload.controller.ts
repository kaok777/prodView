import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/decorators';

/**
 * UploadController
 *
 * Handles file upload operations with security validations
 * Fixed: LOW-B2 - Exposed file metadata in upload responses (removed filename)
 */
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  @Roles('admin')
  @Post('image')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    if (file.size > 10485760) {
      throw new PayloadTooLargeException('File size exceeds 10MB limit');
    }

    if (!file.filename.match(/^[a-f0-9-]+\.(jpg|jpeg|png|gif|webp)$/i)) {
      throw new BadRequestException('Invalid filename format');
    }

    // Fixed: LOW-B2 - Removed filename from response (information disclosure)
    // Only return path, mimetype, and size
    return {
      path: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
