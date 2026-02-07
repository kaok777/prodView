import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, basename } from 'path';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('UPLOAD_DIR', './uploads'),
          filename: (req, file, callback) => {
            const sanitizedBasename = basename(file.originalname)
              .replace(/[^a-zA-Z0-9.-]/g, '_')
              .substring(0, 100);
            const ext = extname(sanitizedBasename).toLowerCase();
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

            if (!allowedExtensions.includes(ext)) {
              callback(new Error('Invalid file extension'), '');
              return;
            }

            const uniqueName = `${uuidv4()}${ext}`;
            callback(null, uniqueName);
          },
        }),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE', 10485760),
          files: 1,
          fields: 1,
        },
        fileFilter: (req, file, callback) => {
          const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
          ];

          const mimeType = file.mimetype.toLowerCase();
          const originalName = file.originalname.toLowerCase();

          if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            callback(new Error('Invalid file extension'), false);
            return;
          }

          if (!allowedMimes.includes(mimeType)) {
            callback(new Error('Invalid file type. Only images are allowed.'), false);
            return;
          }

          if (file.originalname.length > 255) {
            callback(new Error('Filename too long'), false);
            return;
          }

          callback(null, true);
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
