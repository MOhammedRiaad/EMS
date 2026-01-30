import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTenantOwnerDto, CreateUserDto, AuthResponseDto, SetupPasswordDto, EnableTwoFactorDto, VerifyTwoFactorDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto | { requiresTwoFactor: boolean; userId: string; tenantId: string }> {
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

    @Post('2fa/generate')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
    async generateTwoFactor(@Request() req: any) {
        return this.authService.generateTwoFactorSecret(req.user);
    }

    @Post('2fa/enable')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Enable 2FA with verification token' })
    async enableTwoFactor(@Request() req: any, @Body() dto: EnableTwoFactorDto) {
        return this.authService.enableTwoFactor(req.user, dto.token);
    }

    @Post('2fa/disable')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Disable 2FA' })
    async disableTwoFactor(@Request() req: any) {
        return this.authService.disableTwoFactor(req.user.userId || req.user.id);
    }

    @Post('2fa/authenticate')
    @ApiOperation({ summary: 'Complete login with 2FA token' })
    async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
        return this.authService.verifyTwoFactorLogin(dto.userId, dto.token);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.email, dto.token, dto.newPassword);
    }
}

