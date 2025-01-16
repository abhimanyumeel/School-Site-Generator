import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateThemeDataDto {
  @IsNotEmpty()
  @IsString()
  themeName: string;

  @IsObject()
  data: Record<string, any>;

  @IsNotEmpty()
  @IsString()
  websiteId: string;
} 