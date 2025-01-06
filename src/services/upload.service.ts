import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { DocumentGroup } from '../entities/document-group.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadDir = 'public/uploads';
  private readonly hugoStaticDir = 'themes';
  private readonly tempDir = 'temp';

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentGroup)
    private documentGroupRepository: Repository<DocumentGroup>,
  ) {
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, this.tempDir), { recursive: true });
  }

  async uploadImage(
    file: Express.Multer.File,
    schoolWebsiteId: string | undefined,
    section: string,
    fieldId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type');
      }

      const ext = '.webp';
      const filename = `${uuidv4()}${ext}`;
      
      // Determine upload path based on whether we have a website ID
      const uploadPath = schoolWebsiteId 
        ? path.join(this.uploadDir, schoolWebsiteId)
        : path.join(this.uploadDir, this.tempDir);

      const hugoPath = schoolWebsiteId
        ? path.join(this.hugoStaticDir, schoolWebsiteId, 'static/uploads')
        : path.join(this.hugoStaticDir, this.tempDir, 'static/uploads');

      // Ensure directories exist
      await fs.mkdir(uploadPath, { recursive: true });
      await fs.mkdir(hugoPath, { recursive: true });

      // Process and save image
      const processedImagePath = path.join(uploadPath, filename);
      await this.processAndSaveImage(file, processedImagePath);

      // Copy to Hugo static directory
      await fs.copyFile(
        processedImagePath,
        path.join(hugoPath, filename)
      );

      if (schoolWebsiteId) {
        let documentGroup = await this.documentGroupRepository.findOne({
          where: {
            schoolWebsiteId,
            accessor: `${section}.${fieldId}`,
          },
        });

        if (!documentGroup) {
          documentGroup = await this.documentGroupRepository.save({
            schoolWebsiteId,
            accessor: `${section}.${fieldId}`,
          });
        }

        const document = await this.documentRepository.save({
          type: 'image',
          name: file.originalname,
          mimeType: 'image/webp',
          path: processedImagePath,
          url: `/uploads/${schoolWebsiteId}/${filename}`,
          documentGroupId: documentGroup.id,
          order: 0,
        });

        return {
          id: document.id,
          url: document.url,
          name: document.name,
        };
      }

      // Return simplified response for temporary uploads
      return {
        url: `/uploads/${this.tempDir}/${filename}`,
        name: file.originalname,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(error.message || 'Failed to upload image');
    }
  }

  private async processAndSaveImage(file: Express.Multer.File, outputPath: string) {
    await sharp(file.buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
  }

  async deleteImage(documentId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['documentGroup'],
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    // Delete physical files
    try {
      await fs.unlink(document.path);
      // Also delete from Hugo static directory
      const hugoPath = document.path.replace(this.uploadDir, this.hugoStaticDir);
      await fs.unlink(hugoPath);
    } catch (error) {
      console.error('Error deleting files:', error);
    }

    // Delete database record
    await this.documentRepository.remove(document);
    return { success: true };
  }
}
