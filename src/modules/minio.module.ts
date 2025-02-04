import { Module } from '@nestjs/common';
import { MinioService } from '../services/minio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [MinioService],
    exports: [MinioService],
})

export class MinioModule {}