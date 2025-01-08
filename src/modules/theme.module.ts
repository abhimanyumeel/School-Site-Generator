import { Module } from '@nestjs/common';
import { ThemeController } from '../controllers/theme.controller';
import { ThemeService } from '../services/theme.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolWebsite } from '../entities/school-website.entity';
import { WebsiteVersion } from '../entities/website-version.entity';
import { UploadService } from 'src/services/upload.service';
import { Document } from 'src/entities/document.entity';
import { DocumentGroup } from 'src/entities/document-group.entity';
import { UploadController } from 'src/controllers/upload.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolWebsite, WebsiteVersion, Document, DocumentGroup])
  ],
  controllers: [ThemeController, UploadController],
  providers: [ThemeService, UploadService],
  exports: [ThemeService]
})
export class ThemeModule {} 