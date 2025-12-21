import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    @ApiOperation({ summary: 'List all tenants' })
    findAll() {
        return this.tenantsService.findAll();
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
}
