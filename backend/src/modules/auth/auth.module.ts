import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role.entity';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnerModule } from '../owner/owner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Permission, Role, UserRoleAssignment]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-dev-secret',
        signOptions: {
          expiresIn: 604800, // 7 days in seconds
        },
      }),
      inject: [ConfigService],
    }),
    TenantsModule,
    forwardRef(() => OwnerModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionService, RoleService],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    PermissionService,
    RoleService,
  ],
})
export class AuthModule {}
