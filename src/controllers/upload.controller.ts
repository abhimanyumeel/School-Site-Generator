import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UploadService } from '../services/upload.service';
import { UploadImageDto } from '../dto/upload.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadImageDto: UploadImageDto,
  ) {
    return this.uploadService.uploadImage(
      file,
      uploadImageDto.schoolWebsiteId,
      uploadImageDto.section,
      uploadImageDto.fieldId,
    );
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    return this.uploadService.deleteImage(id);
  }
} 