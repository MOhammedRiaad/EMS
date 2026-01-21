import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicesService } from './devices.service';
import { EmsDevice } from './entities/ems-device.entity';
import { NotFoundException } from '@nestjs/common';

describe('DevicesService', () => {
    let service: DevicesService;
    let repository: jest.Mocked<Repository<EmsDevice>>;

    const mockDevice = {
        id: 'device-123',
        tenantId: 'tenant-123',
        studioId: 'studio-123',
        label: 'EMS Device 1',
        serialNumber: 'SN123456',
        status: 'available' as const,
        studio: { id: 'studio-123', name: 'Downtown Studio' },
    } as EmsDevice;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DevicesService,
                {
                    provide: getRepositoryToken(EmsDevice),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DevicesService>(DevicesService);
        repository = module.get(getRepositoryToken(EmsDevice));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all devices for tenant', async () => {
            repository.find.mockResolvedValue([mockDevice]);

            const result = await service.findAll('tenant-123');

            expect(result).toEqual([mockDevice]);
            expect(repository.find).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-123' },
                relations: ['studio'],
                order: { label: 'ASC' },
            });
        });
    });

    describe('findByStudio', () => {
        it('should return devices for specific studio', async () => {
            repository.find.mockResolvedValue([mockDevice]);

            const result = await service.findByStudio('studio-123', 'tenant-123');

            expect(result).toEqual([mockDevice]);
            expect(repository.find).toHaveBeenCalledWith({
                where: { studioId: 'studio-123', tenantId: 'tenant-123' },
                relations: ['studio'],
                order: { label: 'ASC' },
            });
        });
    });

    describe('findAvailableByStudio', () => {
        it('should return only available devices for studio', async () => {
            repository.find.mockResolvedValue([mockDevice]);

            const result = await service.findAvailableByStudio('studio-123', 'tenant-123');

            expect(result).toEqual([mockDevice]);
            expect(repository.find).toHaveBeenCalledWith({
                where: { studioId: 'studio-123', tenantId: 'tenant-123', status: 'available' },
                order: { label: 'ASC' },
            });
        });
    });

    describe('findOne', () => {
        it('should return device by id', async () => {
            repository.findOne.mockResolvedValue(mockDevice);

            const result = await service.findOne('device-123', 'tenant-123');

            expect(result).toBe(mockDevice);
        });

        it('should throw NotFoundException if device not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(
                service.findOne('nonexistent', 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        const createDto = {
            studioId: 'studio-123',
            label: 'New Device',
            serialNumber: 'SN999999',
        };

        it('should create a device', async () => {
            repository.create.mockReturnValue(mockDevice);
            repository.save.mockResolvedValue(mockDevice);

            const result = await service.create(createDto, 'tenant-123');

            expect(repository.create).toHaveBeenCalledWith({
                ...createDto,
                tenantId: 'tenant-123',
            });
            expect(result).toBe(mockDevice);
        });
    });

    describe('update', () => {
        const updateDto = { label: 'Updated Device' };

        it('should update device', async () => {
            repository.findOne.mockResolvedValue(mockDevice);
            repository.save.mockResolvedValue({ ...mockDevice, ...updateDto });

            const result = await service.update('device-123', updateDto, 'tenant-123');

            expect(result.label).toBe('Updated Device');
        });
    });

    describe('updateStatus', () => {
        it('should update device status', async () => {
            repository.findOne.mockResolvedValue(mockDevice);
            repository.save.mockImplementation(async (d) => d as EmsDevice);

            const result = await service.updateStatus('device-123', 'in_use', 'tenant-123');

            expect(result.status).toBe('in_use');
        });
    });

    describe('remove', () => {
        it('should remove device', async () => {
            repository.findOne.mockResolvedValue(mockDevice);
            repository.remove.mockResolvedValue(mockDevice);

            await service.remove('device-123', 'tenant-123');

            expect(repository.remove).toHaveBeenCalledWith(mockDevice);
        });
    });
});
