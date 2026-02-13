import { Test, TestingModule } from '@nestjs/testing';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantsService } from '../tenants.service';
import { PlanService } from '../../owner/services/plan.service';
import { RoleService } from '../../auth/services/role.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserRoleAssignment } from '../../auth/entities/user-role.entity';
import { RegisterTenantOwnerDto } from '../../auth/dto';

describe('TenantProvisioningService', () => {
    let service: TenantProvisioningService;
    let tenantsService: Partial<TenantsService>;
    let planService: Partial<PlanService>;
    let roleService: Partial<RoleService>;
    let userRepository: any;
    let userRoleRepository: any;

    beforeEach(async () => {
        tenantsService = {
            create: jest.fn().mockResolvedValue({ id: 'tenant-123', name: 'Test Biz', isComplete: false }),
        };
        planService = {
            assignPlanToTenant: jest.fn().mockResolvedValue(true),
        };
        roleService = {
            getRoleByKey: jest.fn().mockResolvedValue({ id: 'role-123', key: 'tenant_owner' }),
            assignRoleToUser: jest.fn().mockResolvedValue(true),
        };
        userRepository = {
            create: jest.fn().mockReturnValue({ id: 'user-123' }),
            save: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
        };
        userRoleRepository = {
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantProvisioningService,
                { provide: TenantsService, useValue: tenantsService },
                { provide: PlanService, useValue: planService },
                { provide: RoleService, useValue: roleService },
                { provide: getRepositoryToken(User), useValue: userRepository },
                { provide: getRepositoryToken(UserRoleAssignment), useValue: userRoleRepository },
            ],
        }).compile();

        service = module.get<TenantProvisioningService>(TenantProvisioningService);
    });

    it('should provision a tenant with default plan', async () => {
        const dto: RegisterTenantOwnerDto = {
            businessName: 'Test Biz',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
        };

        const result = await service.provisionTenant(dto);

        expect(tenantsService.create).toHaveBeenCalledWith({ name: 'Test Biz' });
        expect(planService.assignPlanToTenant).toHaveBeenCalledWith('tenant-123', 'trial');
        expect(userRepository.create).toHaveBeenCalled();
        expect(roleService.assignRoleToUser).toHaveBeenCalledWith('user-123', 'role-123');

        // Harden assertions: verify properties instead of just presence
        expect(result.tenant).toMatchObject({ id: 'tenant-123', name: 'Test Biz' });
        expect(result.user).toMatchObject({ id: 'user-123' });
    });

    it('should provision a tenant with selected plan', async () => {
        const dto: RegisterTenantOwnerDto = {
            businessName: 'Test Biz',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            planKey: 'starter',
        };

        await service.provisionTenant(dto);

        expect(planService.assignPlanToTenant).toHaveBeenCalledWith('tenant-123', 'starter');
    });

    it('should throw Error if plan assignment fails', async () => {
        const dto: RegisterTenantOwnerDto = {
            businessName: 'Test Biz',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
        };

        (planService.assignPlanToTenant as jest.Mock).mockRejectedValue(new Error('Plan not found'));

        await expect(service.provisionTenant(dto)).rejects.toThrow('Failed to assign plan trial to tenant tenant-123: Plan not found');
    });

    it('should throw NotFoundException if tenant_owner role matches', async () => {
        const dto: RegisterTenantOwnerDto = {
            businessName: 'Test Biz',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
        };

        (roleService.getRoleByKey as jest.Mock).mockResolvedValue(null);

        await expect(service.provisionTenant(dto)).rejects.toThrow('Role tenant_owner not found during provisioning');
    });
});
