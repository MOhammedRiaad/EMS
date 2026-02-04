import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Coach } from './entities/coach.entity';
import {
  CoachTimeOffRequest,
  TimeOffStatus,
} from './entities/coach-time-off.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(CoachTimeOffRequest)
    private readonly timeOffRepository: Repository<CoachTimeOffRequest>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly mailerService: MailerService,
  ) { }

  async findAll(tenantId: string, search?: string): Promise<Coach[]> {
    const query = this.coachRepository
      .createQueryBuilder('coach')
      .leftJoinAndSelect('coach.user', 'user')
      .leftJoinAndSelect('coach.studio', 'studio')
      .where('coach.tenantId = :tenantId', { tenantId });

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('user.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('user.email ILIKE :search', { search: `%${search}%` })
            .orWhere('coach.bio ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    query.orderBy('coach.createdAt', 'DESC');
    return query.getMany();
  }

  async findByStudio(studioId: string, tenantId: string): Promise<Coach[]> {
    return this.coachRepository.find({
      where: { studioId, tenantId, active: true },
      relations: ['user', 'studio'],
    });
  }

  async findActive(
    tenantId: string,
    clientGender?: string,
    studioId?: string,
  ): Promise<Coach[]> {
    // Build where clause
    const whereClause: any = { tenantId, active: true };

    // Filter by studio if provided
    if (studioId) {
      whereClause.studioId = studioId;
    }

    // Basic active coaches query
    const coaches = await this.coachRepository.find({
      where: whereClause,
      relations: ['user', 'studio'],
      order: { createdAt: 'DESC' },
    });

    // If client gender is provided, filter by preference
    if (clientGender) {
      return coaches.filter(
        (coach) =>
          coach.preferredClientGender === 'any' ||
          (clientGender !== 'prefer_not_to_say' &&
            coach.preferredClientGender === clientGender),
      );
    }

    return coaches;
  }

  async findOne(id: string, tenantId: string): Promise<Coach> {
    const coach = await this.coachRepository.findOne({
      where: { id, tenantId },
      relations: ['user', 'studio'],
    });
    if (!coach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }
    return coach;
  }

  async create(dto: CreateCoachDto, tenantId: string): Promise<Coach> {
    const coach = this.coachRepository.create({
      ...dto,
      tenantId,
    });
    const savedParams = await this.coachRepository.save(coach);

    await this.auditService.log(
      tenantId,
      'CREATE_COACH',
      'Coach',
      savedParams.id,
      coach.userId, // Assuming creator is linked user for now or handled upstream
      { studioId: dto.studioId },
    );

    return savedParams;
  }

  async createWithUser(dto: any, tenantId: string): Promise<Coach> {
    // Check if email already exists
    const existingUser = await this.authService.findByEmail(
      dto.email,
      tenantId,
    );
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // Create user account
    const user = await this.authService.createClientUser(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'coach',
        gender: dto.gender,
      } as any,
      tenantId,
    );

    // Create coach profile
    const coach = this.coachRepository.create({
      userId: user.id,
      studioId: dto.studioId,
      bio: dto.bio,
      specializations: dto.specializations || [],
      preferredClientGender: dto.preferredClientGender || 'any',
      tenantId,
    });

    const savedCoach = await this.coachRepository.save(coach);

    await this.auditService.log(
      tenantId,
      'CREATE_COACH',
      'Coach',
      savedCoach.id,
      coach.userId,
      { studioId: dto.studioId, email: dto.email },
    );

    return savedCoach;
  }

  async update(
    id: string,
    dto: UpdateCoachDto,
    tenantId: string,
  ): Promise<Coach> {
    const coach = await this.findOne(id, tenantId);

    const updatedCoach = { ...coach, ...dto };
    const { changes } = this.auditService.calculateDiff(coach, updatedCoach);

    Object.assign(coach, dto);
    const saved = await this.coachRepository.save(coach);

    if (Object.keys(changes).length > 0) {
      await this.auditService.log(
        tenantId,
        'UPDATE_COACH',
        'Coach',
        coach.id,
        'API_USER',
        { changes },
      );
    }

    return saved;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const coach = await this.findOne(id, tenantId);
    // Soft delete by setting active = false
    coach.active = false;
    await this.coachRepository.save(coach);

    await this.auditService.log(
      tenantId,
      'DELETE_COACH',
      'Coach',
      id,
      'API_USER',
    );
  }

  async getAvailability(id: string, tenantId: string): Promise<any[]> {
    const coach = await this.findOne(id, tenantId);
    return coach.availabilityRules || [];
  }

  async updateAvailability(
    id: string,
    rules: any[],
    tenantId: string,
    user?: any,
  ): Promise<any[]> {
    const coach = await this.findOne(id, tenantId);

    // Permission Check: If user is a coach, enforce restrictions
    if (user && user.role === 'coach') {
      // 1. Ensure they are editing their own profile
      if (coach.userId !== user.id) {
        throw new ForbiddenException('You can only update your own availability');
      }

      // 2. Check tenant setting for availability editing
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      const allowSelfEdit = tenant?.settings?.allowCoachSelfEditAvailability ?? false;

      if (!allowSelfEdit) {
        throw new ForbiddenException('Availability editing is disabled by your studio administrator');
      }
    }

    coach.availabilityRules = rules;
    await this.coachRepository.save(coach);


    await this.auditService.log(
      tenantId,
      'UPDATE_COACH_AVAILABILITY',
      'Coach',
      id,
      'API_USER',
      { rulesCount: rules.length },
    );

    return coach.availabilityRules;
  }

  // ============ Time-Off Request Methods ============

  async createTimeOffRequest(
    coachId: string,
    dto: { startDate: string; endDate: string; notes?: string },
    tenantId: string,
  ): Promise<CoachTimeOffRequest> {
    // Verify coach exists
    await this.findOne(coachId, tenantId);

    const request = this.timeOffRepository.create({
      coachId,
      tenantId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      notes: dto.notes || null,
      status: 'pending',
    });

    return this.timeOffRepository.save(request);
  }

  async getTimeOffRequests(
    tenantId: string,
    status?: TimeOffStatus,
    coachId?: string,
  ): Promise<CoachTimeOffRequest[]> {
    const whereClause: any = { tenantId };
    if (status) whereClause.status = status;
    if (coachId) whereClause.coachId = coachId;

    return this.timeOffRepository.find({
      where: whereClause,
      relations: ['coach', 'coach.user', 'reviewer'],
      order: { requestedAt: 'DESC' },
    });
  }

  async getCoachTimeOffRequests(
    coachId: string,
    tenantId: string,
  ): Promise<CoachTimeOffRequest[]> {
    return this.timeOffRepository.find({
      where: { coachId, tenantId },
      order: { requestedAt: 'DESC' },
    });
  }

  async updateTimeOffStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    tenantId: string,
  ): Promise<CoachTimeOffRequest> {
    const request = await this.timeOffRepository.findOne({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new NotFoundException(`Time-off request not found`);
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException(
        `Request has already been ${request.status}`,
      );
    }

    request.status = status;
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();

    const saved = await this.timeOffRepository.save(request);

    // Fetch coach details for email
    const coach = await this.coachRepository.findOne({
      where: { id: request.coachId },
      relations: ['user'],
    });

    if (coach?.user?.email) {
      const subject = `Time-Off Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
      const text = `Your time-off request for ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been ${status}.`;
      await this.mailerService.sendMail(coach.user.email, subject, text);
    }

    await this.auditService.log(
      tenantId,
      status === 'approved' ? 'APPROVE_TIME_OFF' : 'REJECT_TIME_OFF',
      'CoachTimeOffRequest',
      requestId,
      reviewerId,
      {
        coachId: request.coachId,
        startDate: request.startDate,
        endDate: request.endDate,
      },
    );

    return saved;
  }

  async deleteTimeOffRequest(
    requestId: string,
    coachId: string,
    tenantId: string,
  ): Promise<void> {
    const request = await this.timeOffRepository.findOne({
      where: { id: requestId, coachId, tenantId },
    });

    if (!request) {
      throw new NotFoundException(`Time-off request not found`);
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException(
        `Cannot delete a request that has been ${request.status}`,
      );
    }

    await this.timeOffRepository.remove(request);
  }
}
