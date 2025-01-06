import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UploadImageDto {
  @IsOptional()
  @IsString()
  schoolWebsiteId?: string;

  @IsString()
  section: string;

  @IsString()
  fieldId: string;

  @IsOptional()
  @IsString()
  ratio?: string;

  @IsOptional()
  @IsNumber()
  minWidth?: number;

  @IsOptional()
  @IsNumber()
  minHeight?: number;
}
