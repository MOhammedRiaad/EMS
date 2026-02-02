import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParqService } from './parq.service';
import { ParqResponse } from './entities/parq.entity';
import { CreateParqDto } from './dto/create-parq.dto';

const mockParqRepo = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest
    .fn()
    .mockImplementation((entity) => Promise.resolve({ id: 'uuid', ...entity })),
  findOne: jest.fn(),
  find: jest.fn(),
};

describe('ParqService', () => {
  let service: ParqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParqService,
        {
          provide: getRepositoryToken(ParqResponse),
          useValue: mockParqRepo,
        },
      ],
    }).compile();

    service = module.get<ParqService>(ParqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a parq response and detect risk', async () => {
    const dto: CreateParqDto = {
      clientId: 'client-uuid',
      responses: { q1: false, q2: true }, // One 'true' means risk
      signatureData: 'base64sig',
    };

    const result = await service.create('tenant-uuid', dto);

    expect(result.responses).toEqual(dto.responses);
    expect(result.hasRisk).toBe(true);
    expect(mockParqRepo.create).toHaveBeenCalled();
    expect(mockParqRepo.save).toHaveBeenCalled();
  });

  it('should create a parq response with no risk', async () => {
    const dto: CreateParqDto = {
      clientId: 'client-uuid',
      responses: { q1: false, q2: false },
      signatureData: 'base64sig',
    };

    const result = await service.create('tenant-uuid', dto);

    expect(result.hasRisk).toBe(false);
  });
});
