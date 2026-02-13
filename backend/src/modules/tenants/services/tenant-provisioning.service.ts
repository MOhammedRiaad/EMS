import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsService } from '../tenants.service';
import { PlanService } from '../../owner/services/plan.service';
import { RoleService } from '../../auth/services/role.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterTenantOwnerDto } from '../../auth/dto';
import { UserRoleAssignment } from '../../auth/entities/user-role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantProvisioningService {
    constructor(
        private readonly tenantsService: TenantsService,
        private readonly planService: PlanService,
        private readonly roleService: RoleService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserRoleAssignment)
        private readonly userRoleRepository: Repository<UserRoleAssignment>,
    ) { }

    /**
     * Provision a new tenant, user, plan, and roles
     */
    async provisionTenant(dto: RegisterTenantOwnerDto): Promise<{ tenant: any; user: User }> {
        // 1. Create Tenant
        const tenant = await this.tenantsService.create({
            name: dto.businessName,
        });

        // 2. Assign Plan (Default to 'trial' if not provided)
        const planKey = dto.planKey || 'trial';
        try {
            await this.planService.assignPlanToTenant(tenant.id, planKey);
        } catch (error) {
            throw new Error(`Failed to assign plan ${planKey} to tenant ${tenant.id}: ${error.message}`);
        }

        // 3. Create User (Tenant Owner)
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = this.userRepository.create({
            tenantId: tenant.id,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'tenant_owner', // Keep legacy string for now
            active: true,
        });

        await this.userRepository.save(user);

        // 4. Assign Role Entity
        const role = await this.roleService.getRoleByKey('tenant_owner');
        if (role) {
            await this.roleService.assignRoleToUser(user.id, role.id);
        } else {
            throw new NotFoundException('Role tenant_owner not found during provisioning');
        }

        // 5. Initialize Settings (branding, cancellation policy defaults)
        // This can be expanded later. For now, TenantsService.create might handle some, 
        // or we can update tenant.settings here.

        // Refetch tenant to get the updated plan info if needed, or just return as is.
        // The auth service mostly needs the tenant object.

        return { tenant, user };
    }
}
