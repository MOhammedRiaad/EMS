import { OwnerUsersController } from './owner-users.controller';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

describe('OwnerUsersController', () => {
    let controller: OwnerUsersController;
    let userRepo: any;

    beforeEach(() => {
        console.log('Setting up test...');
        const mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
        };

        userRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };

        try {
            controller = new OwnerUsersController(userRepo as Repository<User>);
            console.log('Controller instantiated');
        } catch (e) {
            console.error('Controller instantiation failed', e);
            throw e;
        }
    });

    it('should be defined', () => {
        console.log('Checking definition');
        expect(controller).toBeDefined();
    });

    describe('getUsers', () => {
        it('should filter by default roles (owner, tenant_owner) if no role provided', async () => {
            console.log('Testing default roles');
            try {
                await controller.getUsers();
                console.log('getUsers called successfully');
            } catch (e) {
                console.error('getUsers failed', e);
                throw e;
            }

            const qb = userRepo.createQueryBuilder();
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.tenant', 'tenant');
            expect(qb.andWhere).toHaveBeenCalledWith('user.role IN (:...roles)', {
                roles: ['owner', 'tenant_owner'],
            });
        });

        it('should filter by specific role if provided', async () => {
            console.log('Testing specific role');
            await controller.getUsers(undefined, 'admin');

            const qb = userRepo.createQueryBuilder();
            expect(qb.andWhere).toHaveBeenCalledWith('user.role = :role', {
                role: 'admin',
            });
        });

        it('should include tenant name in response items', async () => {
            console.log('Testing tenant name');
            const mockUsers = [
                { id: '1', role: 'owner', tenant: { name: 'Tenant A' } },
                { id: '2', role: 'tenant_owner', tenant: null },
            ];
            const qb = userRepo.createQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([mockUsers, 2]);

            const result = await controller.getUsers();

            expect(result.items[0]).toEqual(expect.objectContaining({ tenantName: 'Tenant A' }));
            expect(result.items[1]).toEqual(expect.objectContaining({ tenantName: 'N/A' }));
        });
    });
});
