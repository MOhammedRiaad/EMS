import { Test, TestingModule } from '@nestjs/testing';
import { SessionParticipantsService } from './session-participants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionParticipant } from './entities/session-participant.entity';
import { Session } from './entities/session.entity';
import { PackagesService } from '../packages/packages.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionParticipantsService', () => {
    let service: SessionParticipantsService;
    let participantRepo;
    let sessionRepo;
    let packagesService;

    const mockParticipantRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
    };

    const mockSessionRepo = {
        findOne: jest.fn(),
    };

    const mockPackagesService = {
        getActivePackageForClient: jest.fn(),
        findBestPackageForSession: jest.fn(),
        useSession: jest.fn(),
        returnSession: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionParticipantsService,
                { provide: getRepositoryToken(SessionParticipant), useValue: mockParticipantRepo },
                { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
                { provide: PackagesService, useValue: mockPackagesService },
            ],
        }).compile();

        service = module.get<SessionParticipantsService>(SessionParticipantsService);
        participantRepo = module.get(getRepositoryToken(SessionParticipant));
        sessionRepo = module.get(getRepositoryToken(Session));
        packagesService = module.get(PackagesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addParticipant', () => {
        it('should add a participant to a group session', async () => {
            const session = { id: 's1', type: 'group', capacity: 10, participants: [], tenantId: 't1' };
            const activePackage = { id: 'p1', sessionsRemaining: 5 };

            mockSessionRepo.findOne.mockResolvedValue(session);
            mockParticipantRepo.findOne.mockResolvedValue(null); // Not joined yet
            mockPackagesService.findBestPackageForSession.mockResolvedValue(activePackage);
            mockParticipantRepo.create.mockReturnValue({ sessionId: 's1', clientId: 'c1', status: 'scheduled' });
            mockParticipantRepo.save.mockResolvedValue({ sessionId: 's1', clientId: 'c1', status: 'scheduled' });

            const result = await service.addParticipant('s1', 'c1', 't1');

            expect(result).toBeDefined();
            expect(mockParticipantRepo.save).toHaveBeenCalled();
        });

        it('should fail if session is individual', async () => {
            const session = { id: 's1', type: 'individual', participants: [], tenantId: 't1' };
            mockSessionRepo.findOne.mockResolvedValue(session);

            await expect(service.addParticipant('s1', 'c1', 't1')).rejects.toThrow(BadRequestException);
        });

        it('should fail if capacity reached', async () => {
            const session = { id: 's1', type: 'group', capacity: 1, participants: [{ id: 'p1' }], tenantId: 't1' };
            mockSessionRepo.findOne.mockResolvedValue(session);

            await expect(service.addParticipant('s1', 'c1', 't1')).rejects.toThrow(BadRequestException);
        });

        it('should fail if user has no active package', async () => {
            const session = { id: 's1', type: 'group', capacity: 10, participants: [], tenantId: 't1' };
            mockSessionRepo.findOne.mockResolvedValue(session);
            mockParticipantRepo.findOne.mockResolvedValue(null);
            mockPackagesService.findBestPackageForSession.mockResolvedValue(null);

            await expect(service.addParticipant('s1', 'c1', 't1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateStatus', () => {
        it('should NOT deduct session when status changes from scheduled to completed', async () => {
            const participant = { sessionId: 's1', clientId: 'c1', status: 'scheduled', tenantId: 't1', clientPackageId: 'p1' };
            const activePackage = { id: 'p1' };

            mockParticipantRepo.findOne.mockResolvedValue(participant);
            mockPackagesService.findBestPackageForSession.mockResolvedValue(activePackage);
            mockParticipantRepo.save.mockImplementation(p => Promise.resolve(p));

            await service.updateStatus('s1', 'c1', 'completed', 't1');

            expect(mockPackagesService.useSession).not.toHaveBeenCalled();
            expect(participant.status).toBe('completed');
        });

        it('should refund session when status changes from completed to cancelled', async () => {
            const participant = { sessionId: 's1', clientId: 'c1', status: 'completed', tenantId: 't1', clientPackageId: 'p1' };

            mockParticipantRepo.findOne.mockResolvedValue(participant);
            mockParticipantRepo.save.mockImplementation(p => Promise.resolve(p));

            await service.updateStatus('s1', 'c1', 'cancelled', 't1');

            expect(mockPackagesService.returnSession).toHaveBeenCalledWith('p1', 't1');
            expect(participant.status).toBe('cancelled');
        });

        it('should deduct session when status changes from cancelled to scheduled', async () => {
            const participant = { sessionId: 's1', clientId: 'c1', status: 'cancelled', tenantId: 't1', clientPackageId: 'p1' };

            mockParticipantRepo.findOne.mockResolvedValue(participant);
            mockParticipantRepo.save.mockImplementation(p => Promise.resolve(p));

            await service.updateStatus('s1', 'c1', 'scheduled', 't1');

            expect(mockPackagesService.useSession).toHaveBeenCalledWith('p1', 't1');
            expect(participant.status).toBe('scheduled');
        });
    });
});
