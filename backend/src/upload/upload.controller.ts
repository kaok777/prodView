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
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/decorators';
import { ImageProcessingService } from './image-processing.service';

/**
 * UploadController
 *
 * Handles file upload operations with security validations and image optimization
 * Fixed: LOW-B2 - Exposed file metadata in upload responses (removed filename)
 * Fixed: F2.4.1 - Implemented image optimization and compression
 * Fixed: F2.4.4 - Implemented image dimension validation
 */
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly configService: ConfigService,
  ) {}

  @Roles('admin')
  @Post('image')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
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

    // Validate image dimensions (F2.4.4)
    const dimensionValidation = await this.imageProcessingService.validateImageDimensions(file.path);
    if (!dimensionValidation.valid) {
      throw new BadRequestException(dimensionValidation.reason || 'Invalid image dimensions');
    }

    // Process image: resize, compress, generate thumbnails and WebP versions (F2.4.1)
    const uploadsDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const processedImage = await this.imageProcessingService.processImage(file.path, uploadsDir);

    // Return processed image data
    // Note: Clients should use 'optimized' for full-size display, 'thumbnail' for listings, 'webp' for modern browsers
    return {
      path: processedImage.optimized, // Primary path for backwards compatibility
      original: processedImage.original,
      optimized: processedImage.optimized,
      thumbnail: processedImage.thumbnail,
      webp: processedImage.webp,
      mimetype: file.mimetype,
      size: processedImage.metadata.size,
      width: processedImage.metadata.width,
      height: processedImage.metadata.height,
    };
  }
}
