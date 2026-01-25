import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TermsService } from './terms.service';
import { TermsOfService } from './entities/terms.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';
import { CreateTermsDto } from './dto/terms.dto';

const mockTermsRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'terms-uuid', ...entity })),
    findOne: jest.fn(),
    update: jest.fn(),
};

const mockAcceptanceRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'acc-uuid', ...entity })),
    findOne: jest.fn(),
};

describe('TermsService', () => {
    let service: TermsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TermsService,
                {
                    provide: getRepositoryToken(TermsOfService),
                    useValue: mockTermsRepo,
                },
                {
                    provide: getRepositoryToken(TermsAcceptance),
                    useValue: mockAcceptanceRepo,
                },
            ],
        }).compile();

        service = module.get<TermsService>(TermsService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create new terms and deactivate active ones', async () => {
        const dto: CreateTermsDto = {
            version: '1.0',
            content: 'Terms content',
            isActive: true,
        };

        const result = await service.create('tenant-uuid', dto);

        expect(mockTermsRepo.update).toHaveBeenCalledWith(
            { tenantId: 'tenant-uuid', isActive: true },
            { isActive: false }
        );
        expect(result.version).toBe('1.0');
        expect(result.isActive).toBe(true);
    });

    it('should accept terms', async () => {
        mockTermsRepo.findOne.mockResolvedValue({ id: 'terms-uuid' });
        mockAcceptanceRepo.findOne.mockResolvedValue(null);

        const result = await service.accept('tenant-uuid', 'client-uuid', 'terms-uuid', '127.0.0.1');

        expect(result.clientId).toBe('client-uuid');
        expect(result.termsId).toBe('terms-uuid');
        expect(result.ipAddress).toBe('127.0.0.1');
    });

    it('should return existing acceptance if already accepted', async () => {
        mockTermsRepo.findOne.mockResolvedValue({ id: 'terms-uuid' });
        mockAcceptanceRepo.findOne.mockResolvedValue({ id: 'acc-uuid' });

        const result = await service.accept('tenant-uuid', 'client-uuid', 'terms-uuid');

        expect(result.id).toBe('acc-uuid');
        expect(mockAcceptanceRepo.create).not.toHaveBeenCalled(); // Should not create new
    });
});
