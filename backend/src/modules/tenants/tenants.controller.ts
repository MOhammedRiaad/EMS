import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('check-slug')
  @ApiOperation({ summary: 'Check if a tenant slug is available' })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Business name to check',
  })
  async checkSlug(@Query('name') name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const available = await this.tenantsService.checkSlugAvailable(slug);
    return { slug, available };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Request() req: any,
  ) {
    // Only tenant_owner can update their own tenant
    if (req.user.role !== 'tenant_owner' || req.user.tenantId !== id) {
      throw new ForbiddenException('You can only update your own tenant');
    }
    return this.tenantsService.update(id, dto);
  }
}
