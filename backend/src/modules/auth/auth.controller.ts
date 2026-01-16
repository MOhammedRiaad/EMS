import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTenantOwnerDto, CreateUserDto, AuthResponseDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new Tenant and Tenant Owner' })
    async register(@Body() dto: RegisterTenantOwnerDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Post('users')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new user within the tenant (admin/owner only)' })
    async createUser(@Body() dto: CreateUserDto, @Request() req: any) {
        return this.authService.createUser(dto, req.user);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user info' })
    me(@Request() req: any) {
        return req.user;
    }
}

