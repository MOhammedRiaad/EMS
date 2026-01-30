import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutomationService } from './automation.service';

@Controller('marketing/automations')
@UseGuards(AuthGuard('jwt'))
export class AutomationController {
    constructor(private readonly automationService: AutomationService) { }

    @Post()
    create(@Body() createDto: any) {
        return this.automationService.create(createDto);
    }

    @Get('executions')
    findAllExecutions() {
        return this.automationService.findAllExecutions();
    }

    @Get()
    findAll() {
        return this.automationService.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.automationService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.automationService.delete(id);
    }
}
