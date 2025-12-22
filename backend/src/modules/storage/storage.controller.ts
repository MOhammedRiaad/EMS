import { Controller, Post, Get, Query, Res, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Header, BadRequestException, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
                    // new FileTypeValidator({ fileType: 'image/*' }), // Optional: restrict to images
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        const key = await this.storageService.uploadFile(file, 'uploads');
        return { url: `/api/storage/file?key=${key}` }; // Return relative URL
    }

    @Get('file')
    @ApiOperation({ summary: 'Download a file' })
    async downloadFile(@Query('key') key: string, @Res() res: Response) {
        if (!key) throw new BadRequestException('Key is required');

        try {
            const fileStream = await this.storageService.getFile(key);
            fileStream.pipe(res);
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
}
