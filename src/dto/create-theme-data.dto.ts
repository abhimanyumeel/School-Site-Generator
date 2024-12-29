import { IsNotEmpty, IsString } from 'class-validator';

export class CreateThemeDataDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  author: string;

  @IsNotEmpty()
  @IsString()
  themeName: string;
} 