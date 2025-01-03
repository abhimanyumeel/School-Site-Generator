import { Module } from '@nestjs/common';
import { ThemeController } from '../controllers/theme.controller';
import { ThemeService } from '../services/theme.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolWebsite } from '../entities/school-website.entity';
import { WebsiteVersion } from '../entities/website-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolWebsite, WebsiteVersion])
  ],
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService]
})
export class ThemeModule {} 