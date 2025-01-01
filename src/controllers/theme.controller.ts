import { 
  Controller, 
  Get,
  Post, 
  Body, 
  HttpStatus, 
  HttpCode,
  HttpException,
  Param,
  Req,
  UseGuards
} from '@nestjs/common';
import { ThemeService } from '../services/theme.service';
import { CreateThemeDataDto } from '../dto/create-theme-data.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

// Add interface to extend Request
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('themes')
@UseGuards(JwtAuthGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAvailableThemes() {
    try {
      const themes = await this.themeService.getAllThemes();
      return {
        statusCode: HttpStatus.OK,
        message: 'Themes fetched successfully',
        data: themes
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to fetch themes',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':themeId')
  async getTheme(@Param('themeId') themeId: string) {
    const theme = await this.themeService.getThemeMetadata(themeId);
    return {
      id: themeId,
      name: theme.displayName || themeId,
      previewPath: `/images/themes/${themeId}/preview.jpg`,
      metadata: theme
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateTheme(@Body() themeData: CreateThemeDataDto, @Req() req: RequestWithUser) {
    console.log('User from request:', req.user);
    try {
      const result = await this.themeService.generateTheme(themeData, req.user.id);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Theme generated successfully',
        data: result
      };
    } catch (error) {
      console.error('Theme generation error:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to generate theme',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 