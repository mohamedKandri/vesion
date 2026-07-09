import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.scr', '.jar', '.com', '.vbs', '.js', '.html', '.htm', '.svg',
]);

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: config.get<string>('uploads.dir'),
          filename: (_req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase().slice(0, 10);
            cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
          },
        }),
        limits: { fileSize: config.get<number>('uploads.maxSizeMb')! * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          if (BLOCKED_EXTENSIONS.has(ext)) {
            cb(new Error('This file type is not allowed'), false);
            return;
          }
          cb(null, true);
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
