import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { User } from '../auth/entities/user.entity';
import { UserRoleAssignment } from '../auth/entities/user-role.entity';
import { PlanService } from '../owner/services/plan.service';
import { RoleService } from '../auth/services/role.service';
import { OwnerModule } from '../owner/owner.module';
import { AuthModule } from '../auth/auth.module';
import { Plan } from '../owner/entities/plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, UserRoleAssignment, Plan]),
    forwardRef(() => AuthModule),
    forwardRef(() => OwnerModule),
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantProvisioningService],
  exports: [TenantsService, TenantProvisioningService],
})
export class TenantsModule { }
