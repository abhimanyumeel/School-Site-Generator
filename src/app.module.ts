import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ThemeModule } from './modules/theme.module';
import { entities } from './entities';
import { AuthModule } from './modules/auth.module';
import { WebsiteService } from './services/website.service';
import { WebsiteController } from './controllers/website.controller';
import { SchoolWebsite } from './entities/school-website.entity';
import { PreviewController } from './controllers/preview.controller';
import { PreviewService } from './services/preview.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...getDatabaseConfig(configService),
        entities: [...Object.values(entities), SchoolWebsite],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([SchoolWebsite]),
    ThemeModule,
    AuthModule,
  ],
  controllers: [AppController, WebsiteController, PreviewController],
  providers: [AppService, WebsiteService, PreviewService],
})
export class AppModule {}
