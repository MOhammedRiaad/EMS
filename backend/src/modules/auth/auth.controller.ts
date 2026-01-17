import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTenantOwnerDto, CreateUserDto, AuthResponseDto, SetupPasswordDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('setup')
    @ApiOperation({ summary: 'Set password using invite token' })
    async setupPassword(@Body() dto: SetupPasswordDto): Promise<AuthResponseDto> {
        return this.authService.setupPassword(dto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new Tenant and Tenant Owner' })
    async register(@Body() dto: RegisterTenantOwnerDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Get('users')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List users in tenant' })
    @ApiQuery({ name: 'role', required: false })
    async listUsers(@Request() req: any, @Query('role') role?: string) {
        return this.authService.findAllByTenant(req.user.tenantId, role);
    }

    @Post('users')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new user within the tenant (admin/owner only)' })
    async createUser(@Body() dto: CreateUserDto, @Request() req: any) {
        return this.authService.createUser(dto, req.user);
    }
}

