import { 
  Controller, 
  Get,
  Post, 
  Body, 
  HttpStatus, 
  HttpCode,
  HttpException
} from '@nestjs/common';
import { ThemeService } from '../services/theme.service';
import { CreateThemeDataDto } from '../dto/create-theme-data.dto';

@Controller('themes')
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

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateTheme(@Body() themeData: CreateThemeDataDto) {
    try {
      const result = await this.themeService.generateTheme(themeData);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Theme generated successfully',
        data: result
      };
    } catch (error) {
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