import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService} from '@nestjs/config';
import * as Minio from 'minio';
import { MinioConfig } from 'src/config/minio.config';

@Injectable()
export class MinioService {
    private minioClient: Minio.Client;
    private readonly logger = new Logger(MinioService.name);

    constructor(private configService: ConfigService) {
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
            port: parseInt(this.configService.get<string>('MINIO_PORT')),
            useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
        });
    }

    //Upload a file to MinIO
    async uploadFile(file: Express.Multer.File): Promise<string> {
        try{
            const bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
            const objectName = `${Date.now()}-${file.originalname}`;
            
            
            await this.minioClient.putObject(
                bucket, 
                objectName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                }
            );

            this.logger.log(`File uploaded successfully: ${objectName}`);
            return objectName;
        } catch (error) {
            this.logger.error(`Error uploading file: ${error.message}`);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    // Get a file URL from MinIO
    async getFileURL(objectName: string): Promise<string> {
        try {
            const bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
            return await this.minioClient.presignedGetObject(bucket, objectName);
        } catch (error) {
            this.logger.error(`Error gettingb file URL: ${error.message}`);
            throw error;
        }
    }

    //Delete a file from MinIO
    async deleteFile(objectName: string): Promise<void> {
        try{
            const bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
            await this.minioClient.removeObject(bucket, objectName);
            this.logger.log(`File deleted successfully: ${objectName}`);
        } catch (error) {
            this.logger.error(`Error deleting file: ${error.message}`);
            throw new InternalServerErrorException('Failed to delete file');
        }
    }

    async fileExists(objectName: string): Promise<boolean> {
        try{
            const bucket = this.configService.get<string>('MINIO_BUCKET_NAME');
            await this.minioClient.statObject(bucket, objectName);
            return true;
        } catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }
}
