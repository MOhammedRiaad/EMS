import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements OnModuleInit {
    private s3Client: S3Client;
    private bucket: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        this.bucket = this.configService.get('MINIO_BUCKET') || 'ems-assets';
        const endpoint = this.configService.get('MINIO_ENDPOINT') || 'http://minio:9000';
        const region = this.configService.get('MINIO_REGION') || 'us-east-1';
        const accessKeyId = this.configService.get('MINIO_ROOT_USER') || 'minio_user';
        const secretAccessKey = this.configService.get('MINIO_ROOT_PASSWORD') || 'minio_secret';

        this.logger.log(`Initializing StorageService with endpoint: ${endpoint}, bucket: ${this.bucket}`);

        this.s3Client = new S3Client({
            endpoint,
            region,
            forcePathStyle: true, // Required for MinIO
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async onModuleInit() {
        await this.ensureBucketExists();
    }

    private async ensureBucketExists() {
        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
            this.logger.log(`Bucket ${this.bucket} exists.`);
        } catch (error) {
            try {
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
                this.logger.log(`Bucket ${this.bucket} created.`);
            } catch (createError) {
                this.logger.error(`Failed to create bucket ${this.bucket}: ${createError.message}`);
            }
        }
    }

    async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
        const key = `${path}/${Date.now()}-${file.originalname}`;

        try {
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            // Return generic URL assuming public access or proxy
            // In production, you might generate a CloudFront URL or Presigned URL
            return key;
        } catch (error) {
            this.logger.error(`File upload failed: ${error.message}`);
            throw error;
        }
    }

    async getFile(key: string): Promise<any> { // Returns stream
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            return response.Body;
        } catch (error) {
            this.logger.error(`File retrieval failed for key ${key}: ${error.message}`);
            throw error;
        }
    }
}
