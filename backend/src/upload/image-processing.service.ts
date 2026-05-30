import { Injectable, InternalServerErrorException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProcessedImage {
  original: string;
  optimized: string;
  thumbnail: string;
  webp?: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

@Injectable()
export class ImageProcessingService {
  /**
   * Process uploaded image: resize, compress, generate thumbnails and WebP versions
   * Implements F2.4.1 - Image optimization and compression
   *
   * @param inputPath - Path to the uploaded image file
   * @param uploadsDir - Directory where processed images will be saved
   * @returns ProcessedImage object with paths to all generated versions
   */
  async processImage(inputPath: string, uploadsDir: string): Promise<ProcessedImage> {
    try {
      // Read image metadata
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      const baseFilename = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);

      // Generate optimized version (max 1920px width, 80% quality)
      const optimizedFilename = `${baseFilename}-optimized${ext}`;
      const optimizedPath = path.join(uploadsDir, optimizedFilename);

      await sharp(inputPath)
        .resize(1920, null, {
          withoutEnlargement: true, // Don't upscale smaller images
          fit: 'inside',
        })
        .jpeg({ quality: 80 })
        .png({ compressionLevel: 8, quality: 80 })
        .toFile(optimizedPath);

      // Generate thumbnail (400px width for product listings)
      const thumbnailFilename = `${baseFilename}-thumb.jpg`;
      const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

      await sharp(inputPath)
        .resize(400, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({ quality: 75 })
        .toFile(thumbnailPath);

      // Generate WebP version for modern browsers
      const webpFilename = `${baseFilename}.webp`;
      const webpPath = path.join(uploadsDir, webpFilename);

      await sharp(inputPath)
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 80 })
        .toFile(webpPath);

      // Get metadata of optimized image
      const optimizedMetadata = await sharp(optimizedPath).metadata();

      // Clean up original unprocessed file (optional - keep for now as backup)
      // await fs.unlink(inputPath);

      return {
        original: `/uploads/${path.basename(inputPath)}`,
        optimized: `/uploads/${optimizedFilename}`,
        thumbnail: `/uploads/${thumbnailFilename}`,
        webp: `/uploads/${webpFilename}`,
        metadata: {
          width: optimizedMetadata.width || 0,
          height: optimizedMetadata.height || 0,
          format: optimizedMetadata.format || 'unknown',
          size: (await fs.stat(optimizedPath)).size,
        },
      };
    } catch (error) {
      console.error('[ImageProcessing] Error processing image:', error);
      throw new InternalServerErrorException('Failed to process image');
    }
  }

  /**
   * Validate image dimensions to prevent malformed images
   * Implements F2.4.4 - Image dimension validation
   *
   * @param filePath - Path to the image file
   * @returns Validation result with dimensions
   */
  async validateImageDimensions(filePath: string): Promise<{
    valid: boolean;
    width?: number;
    height?: number;
    reason?: string;
  }> {
    try {
      const metadata = await sharp(filePath).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Reject images with extreme aspect ratios (> 5:1 or < 1:5)
      const aspectRatio = width / height;
      if (aspectRatio > 5 || aspectRatio < 0.2) {
        return {
          valid: false,
          width,
          height,
          reason: 'Image aspect ratio is too extreme (must be between 1:5 and 5:1)',
        };
      }

      // Reject images with dimensions > 4096px on either axis
      if (width > 4096 || height > 4096) {
        return {
          valid: false,
          width,
          height,
          reason: 'Image dimensions exceed 4096px limit',
        };
      }

      // Reject tiny images (< 50px on either axis)
      if (width < 50 || height < 50) {
        return {
          valid: false,
          width,
          height,
          reason: 'Image is too small (minimum 50px on both dimensions)',
        };
      }

      return {
        valid: true,
        width,
        height,
      };
    } catch (error) {
      return {
        valid: false,
        reason: 'Failed to read image metadata',
      };
    }
  }
}
