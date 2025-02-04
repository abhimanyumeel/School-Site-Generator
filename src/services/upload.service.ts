import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { DocumentGroup } from '../entities/document-group.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';
import { MinioService } from './minio.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = 'public/uploads';
  private readonly hugoStaticDir = 'themes';
  private readonly tempDir = 'temp';

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentGroup)
    private documentGroupRepository: Repository<DocumentGroup>,
    private readonly minioService: MinioService,
  ) {
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, this.tempDir), { recursive: true });
  }



  async copyTempImagesToWebsite(websiteId: string) {
    try {
      this.logger.log('=== Starting Copy Temp Images To Website Process ===');
      this.logger.log(`Website ID: ${websiteId}`);

      // Define paths
      const tempUploadPath = path.join(this.uploadDir, this.tempDir);
      const tempHugoPath = path.join(this.hugoStaticDir, this.tempDir, 'static/uploads');
      const websiteUploadPath = path.join(this.uploadDir, websiteId);
      const websiteHugoPath = path.join(this.hugoStaticDir, websiteId, 'static/uploads');

      this.logger.log('Paths configured:', {
        tempUploadPath,
        tempHugoPath,
        websiteUploadPath,
        websiteHugoPath
      });

      // Create destination directories
      this.logger.log('Creating destination directories...');
      await fs.mkdir(websiteUploadPath, { recursive: true });
      await fs.mkdir(websiteHugoPath, { recursive: true });
      this.logger.log('Destination directories created successfully');

      // Get list of files in temp directory
      this.logger.log(`Reading files from temp directory: ${tempHugoPath}`);
      const files = await fs.readdir(tempHugoPath);
      this.logger.log(`Found ${files.length} files to process in temp directory`);

      if (files.length === 0) {
        this.logger.warn('No files found in temp directory');
      }

      // Copy each file to MinIO and the website directories
      this.logger.log('=== Starting File Processing ===');
      const processedFiles = await Promise.all(files.map(async (file) => {
        try {
          this.logger.log(`Processing file: ${file}`);
          const filePath = path.join(tempUploadPath, file);
          
          // Read file
          this.logger.log(`Reading file from: ${filePath}`);
          const fileBuffer = await fs.readFile(filePath);
          const fileSize = (await fs.stat(filePath)).size;
          this.logger.log(`File read successfully. Size: ${fileSize} bytes`);

          // Upload to MinIO
          this.logger.log('Uploading to MinIO...');
          const minioKey = await this.minioService.uploadFile({
            buffer: fileBuffer,
            originalname: file,
            mimetype: 'image/webp',
            size: fileSize,
          } as Express.Multer.File);
          this.logger.log(`MinIO upload successful. Key: ${minioKey}`);

          // Copy to website directories
          this.logger.log('Copying files to website directories...');
          
          this.logger.log(`Copying to Hugo path: ${websiteHugoPath}`);
          await fs.copyFile(
            path.join(tempHugoPath, file),
            path.join(websiteHugoPath, file)
          );
          
          this.logger.log(`Copying to website upload path: ${websiteUploadPath}`);
          await fs.copyFile(
            path.join(tempUploadPath, file),
            path.join(websiteUploadPath, file)
          );

          this.logger.log(`Successfully processed file: ${file}`);

          return {
            filename: file,
            minioKey,
            success: true
          };
        } catch (error) {
          this.logger.error(`=== File Processing Failed ===`);
          this.logger.error(`Failed to process file ${file}:`, {
            error: error.message,
            stack: error.stack,
            file,
            websiteId
          });
          return {
            filename: file,
            error: error.message,
            success: false
          };
        }
      }));

      // Clean up temp directories
      this.logger.log('=== Starting Cleanup ===');
      this.logger.log('Cleaning temporary directories...');
      await this.cleanTempDirectories();
      this.logger.log('Temporary directories cleaned successfully');

      // Process results
      const successCount = processedFiles.filter(f => f.success).length;
      const failureCount = processedFiles.filter(f => !f.success).length;

      this.logger.log('=== Process Summary ===');
      this.logger.log(`Total files processed: ${files.length}`);
      this.logger.log(`Successfully processed: ${successCount}`);
      this.logger.log(`Failed to process: ${failureCount}`);

      if (failureCount > 0) {
        this.logger.warn('Some files failed to process. Check logs for details.');
        const failedFiles = processedFiles
          .filter(f => !f.success)
          .map(f => f.filename)
          .join(', ');
        this.logger.warn(`Failed files: ${failedFiles}`);
      }

      this.logger.log('=== Copy Process Complete ===');
      return processedFiles;
    } catch (error) {
      this.logger.error('=== Copy Process Failed ===');
      this.logger.error('Error copying temp images:', {
        error: error.message,
        stack: error.stack,
        websiteId
      });
      throw new BadRequestException('Failed to copy images to website directory');
    }
  }

  public async cleanTempDirectories() {
    try {
      const tempUploadPath = path.join(this.uploadDir, this.tempDir);
      const files = await fs.readdir(tempUploadPath);

      // Remove all files in temp directories
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(tempUploadPath, file);
          try {
            await fs.unlink(filePath);
            this.logger.log(`Deleted temp file: ${file}`);
          } catch (error) {
            this.logger.error(`Failed to delete temp file ${file}:`, error);
          }
        })
      );

      this.logger.log('Successfully cleaned up temp directory');

    } catch (error) {
      console.error('Error cleaning temp directories:', error);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    schoolWebsiteId: string | undefined,
    section: string,
    fieldId: string,
  ) {
    try {
      this.logger.log('=== Starting Image Upload Process ===');
      this.logger.log(`Input params: SchoolWebsiteId: ${schoolWebsiteId}, Section: ${section}, FieldId: ${fieldId}`);
      this.logger.log(`Original file details: name=${file.originalname}, type=${file.mimetype}, size=${file.size}`);

      if (!file) {
        this.logger.error('No file provided in request');
        throw new BadRequestException('No file provided');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        this.logger.error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        throw new BadRequestException('Invalid file type');
      }

      const ext = '.webp';
      const filename = `${uuidv4()}${ext}`;
      this.logger.log(`Generated filename: ${filename}`);
      
      // Determine upload path based on whether we have a website ID
      const uploadPath = schoolWebsiteId 
        ? path.join(this.uploadDir, schoolWebsiteId)
        : path.join(this.uploadDir, this.tempDir);
      const hugoTempPath = path.join(this.hugoStaticDir, this.tempDir, 'static/uploads');

      this.logger.log(`Creating directories...`);
      this.logger.log(`Upload path: ${uploadPath}`);
      this.logger.log(`Hugo temp path: ${hugoTempPath}`);

      // Ensure directories exist
      await fs.mkdir(uploadPath, { recursive: true });
      await fs.mkdir(hugoTempPath, {recursive: true});
      this.logger.log('Directories created successfully');

      // Process and save image
      const processedImagePath = path.join(uploadPath, filename);
      this.logger.log(`Processing image and saving to: ${processedImagePath}`);
      await this.processAndSaveImage(file, processedImagePath);
      this.logger.log('Image processed successfully');

      // Copy to hugo temp directory for preview 
      this.logger.log(`Copying to Hugo temp directory: ${hugoTempPath}`);
      await fs.copyFile(processedImagePath, path.join(hugoTempPath, filename));
      this.logger.log('Image copied to Hugo temp directory');

      if (schoolWebsiteId) {
        this.logger.log('=== Starting MinIO Upload Process ===');
        this.logger.log(`Preparing file for MinIO upload: ${filename}`);
        
        const fileBuffer = await fs.readFile(processedImagePath);
        const fileSize = (await fs.stat(processedImagePath)).size;
        this.logger.log(`File prepared for MinIO: size=${fileSize} bytes`);

        this.logger.log('Initiating MinIO upload...');
        const minioKey = await this.minioService.uploadFile({
          buffer: fileBuffer,
          originalname: filename,
          mimetype: 'image/webp',
          size: fileSize,
        } as Express.Multer.File);
        this.logger.log(`MinIO upload successful. Key: ${minioKey}`);

        this.logger.log('=== Starting Database Operations ===');
        this.logger.log(`Looking for document group: website=${schoolWebsiteId}, accessor=${section}.${fieldId}`);
        
        let documentGroup = await this.documentGroupRepository.findOne({
          where: {
            schoolWebsiteId,
            accessor: `${section}.${fieldId}`,
          },
        });

        if (!documentGroup) {
          this.logger.log('Document group not found, creating new one...');
          documentGroup = await this.documentGroupRepository.save({
            schoolWebsiteId,
            accessor: `${section}.${fieldId}`,
          });
          this.logger.log(`New document group created with ID: ${documentGroup.id}`);
        } else {
          this.logger.log(`Existing document group found with ID: ${documentGroup.id}`);
        }

        this.logger.log('Creating document record...');
        const document = await this.documentRepository.save({
          type: 'image',
          name: file.originalname,
          mimeType: 'image/webp',
          path: minioKey,
          url: `/uploads/${schoolWebsiteId}/${filename}`,
          documentGroupId: documentGroup.id,
          order: 0,
        });
        this.logger.log(`Document record created with ID: ${document.id}`);

        this.logger.log('=== Upload Process Complete ===');
        return {
          id: document.id,
          url: document.url,
          name: document.name,
          minioKey,
        };
      }

      this.logger.log('No schoolWebsiteId provided - storing in temp directory only');
      return {
        url: `/uploads/temp/${filename}`,
        name: file.originalname,
      };
    } catch (error) {
      this.logger.error('=== Upload Process Failed ===');
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        context: {
          schoolWebsiteId,
          section,
          fieldId,
          fileName: file?.originalname
        }
      });
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

    try {
      // Delete from MinIO if path is a MinIO key
      if (document.path.startsWith('uploads/')) {
        try {
          await this.minioService.deleteFile(document.path);
          this.logger.log(`Deleted file from MinIO: ${document.path}`);
        } catch (minioError) {
          this.logger.error(`Failed to delete file from MinIO: ${document.path}`, minioError);
        }
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
  } catch (error) {
    this.logger.error('Error in deleteImage:', error);
    throw new BadRequestException('Failed to delete image completely');
  }
}


  public async uploadToMinIO(
    fileBuffer: Buffer,
    filename: string,
    size: number
  ): Promise<string> {
    try {
      const minioKey = await this.minioService.uploadFile({
        buffer: fileBuffer,
        originalname: filename,
        mimetype: 'image/webp',
        size: size,
      } as Express.Multer.File);

      return minioKey;
    } catch (error) {
      this.logger.error('Failed to upload to MinIO:', error);
      throw new BadRequestException('Failed to upload file to storage');
    }
  }
}
