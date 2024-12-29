import { Module } from '@nestjs/common';
import { ThemeController } from '../controllers/theme.controller';
import { ThemeService } from '../services/theme.service';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService],
})
export class ThemeModule {} 