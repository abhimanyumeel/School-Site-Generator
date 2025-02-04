import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService} from '@nestjs/config';
import * as Minio from 'minio';
import { MinioConfig } from 'src/config/minio.config';

@Injectable()
export class MinioService implements OnModuleInit {
    private minioClient: Minio.Client;
    private readonly logger = new Logger(MinioService.name);
    private readonly bucket: string;

    constructor(private configService: ConfigService) {
        // Log all MinIO configuration (except sensitive data)
        this.logger.log('Initializing MinIO service with config:', {
            endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
            port: this.configService.get<string>('MINIO_PORT'),
            useSSL: this.configService.get<string>('MINIO_USE_SSL'),
            bucketName: this.configService.get<string>('MINIO_BUCKET_NAME')
        });

        this.bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
        
        if (!this.bucket) {
            this.logger.error('MINIO_BUCKET_NAME is not defined in environment variables');
            throw new Error('MinIO bucket name is required');
        }

        try {
            this.minioClient = new Minio.Client({
                endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
                port: parseInt(this.configService.get<string>('MINIO_PORT')),
                useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
                accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
                secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
            });
            this.logger.log('MinIO client created successfully');
        } catch (error) {
            this.logger.error('Failed to create MinIO client:', error);
            throw error;
        }
    }

    async onModuleInit() {
        try {
            this.logger.log('Checking MinIO connection and bucket...');
            
            // Test connection
            this.logger.log('Testing MinIO connection...');
            await this.minioClient.listBuckets();
            this.logger.log('Successfully connected to MinIO server');

            // Check bucket
            this.logger.log(`Checking if bucket '${this.bucket}' exists...`);
            const bucketExists = await this.minioClient.bucketExists(this.bucket);
            
            if (!bucketExists) {
                this.logger.log(`Bucket '${this.bucket}' does not exist, creating...`);
                await this.minioClient.makeBucket(this.bucket);
                this.logger.log(`Bucket '${this.bucket}' created successfully`);
            } else {
                this.logger.log(`Bucket '${this.bucket}' already exists`);
            }
            
            this.logger.log('MinIO service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize MinIO service:', error);
            this.logger.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            throw error;
        }
    }

    //Upload a file to MinIO
    async uploadFile(file: Express.Multer.File): Promise<string> {
        try {
            // Create a more organized object name with folder structure
            const objectName = `uploads/${Date.now()}-${file.originalname}`;
            
            // Check if file already exists
            const exists = await this.fileExists(objectName);
            if (exists) {
                throw new InternalServerErrorException('File already exists');
            }
            
            await this.minioClient.putObject(
                this.bucket, 
                objectName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                    'Original-Name': file.originalname,
                    'Upload-Date': new Date().toISOString(),
                }
            );

            this.logger.log(`File uploaded successfully: ${objectName}`);
            return objectName;
        } catch (error) {
            this.logger.error(`Error uploading file: ${error.message}`);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    // Get a file URL from MinIO with optional expiry
    async getFileURL(objectName: string, expirySeconds: number = 7 * 24 * 60 * 60): Promise<string> {
        try {
            if (!await this.fileExists(objectName)) {
                throw new InternalServerErrorException('File not found');
            }
            
            return await this.minioClient.presignedGetObject(
                this.bucket, 
                objectName, 
                expirySeconds
            );
        } catch (error) {
            this.logger.error(`Error getting file URL: ${error.message}`);
            throw new InternalServerErrorException('Failed to get file URL');
        }
    }

    //Delete a file from MinIO
    async deleteFile(objectName: string): Promise<void> {
        try {
            if (!await this.fileExists(objectName)) {
                this.logger.warn(`File does not exist: ${objectName}`);
                return;
            }

            await this.minioClient.removeObject(this.bucket, objectName);
            this.logger.log(`File deleted successfully: ${objectName}`);
        } catch (error) {
            this.logger.error(`Error deleting file: ${error.message}`);
            throw new InternalServerErrorException('Failed to delete file');
        }
    }

    async fileExists(objectName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucket, objectName);
            return true;
        } catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            this.logger.error(`Error checking file existence: ${error.message}`);
            throw new InternalServerErrorException('Failed to check file existence');
        }
    }

    // New helper method to get file metadata
    async getFileMetadata(objectName: string): Promise<Minio.BucketItemStat> {
        try {
            return await this.minioClient.statObject(this.bucket, objectName);
        } catch (error) {
            this.logger.error(`Error getting file metadata: ${error.message}`);
            throw new InternalServerErrorException('Failed to get file metadata');
        }
    }
}
