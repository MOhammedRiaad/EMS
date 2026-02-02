import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';
import { InBodyScansService } from './inbody-scans.service';
import {
  CreateInBodyScanDto,
  UpdateInBodyScanDto,
  InBodyScanQueryDto,
} from './dto';
import { StorageService } from '../../modules/storage/storage.service';

@ApiTags('inbody-scans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('inbody-scans')
export class InBodyScansController {
  constructor(
    private readonly inBodyScansService: InBodyScansService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new InBody scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateInBodyScanDto,
    @Request() req: any,
    @TenantId() tenantId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fileData;
    if (file) {
      const path = `inbody/${tenantId}/${dto.clientId}`;
      const key = await this.storageService.uploadFile(file, path);
      fileData = { url: key, name: file.originalname };
    }
    return this.inBodyScansService.create(dto, req.user.id, tenantId, fileData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all InBody scans with filters' })
  findAll(@Query() query: InBodyScanQueryDto, @TenantId() tenantId: string) {
    return this.inBodyScansService.findAll(query, tenantId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all scans for a specific client' })
  findByClient(
    @Param('clientId') clientId: string,
    @TenantId() tenantId: string,
  ) {
    return this.inBodyScansService.findByClient(clientId, tenantId);
  }

  @Get('client/:clientId/latest')
  @ApiOperation({ summary: 'Get latest scan for a client' })
  findLatest(
    @Param('clientId') clientId: string,
    @TenantId() tenantId: string,
  ) {
    return this.inBodyScansService.findLatest(clientId, tenantId);
  }

  @Get('client/:clientId/progress')
  @ApiOperation({ summary: 'Calculate progress metrics for a client' })
  calculateProgress(
    @Param('clientId') clientId: string,
    @TenantId() tenantId: string,
  ) {
    return this.inBodyScansService.calculateProgress(clientId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get InBody scan by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.inBodyScansService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update InBody scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInBodyScanDto,
    @TenantId() tenantId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fileData;
    if (file) {
      // Need clientId for path, fetch existing scan
      const existing = await this.inBodyScansService.findOne(id, tenantId);
      const path = `inbody/${tenantId}/${existing.clientId}`;
      const key = await this.storageService.uploadFile(file, path);
      fileData = { url: key, name: file.originalname };
    }
    return this.inBodyScansService.update(id, dto, tenantId, fileData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete InBody scan' })
  async delete(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.inBodyScansService.delete(id, tenantId);
    return { message: 'Scan deleted successfully' };
  }
}
