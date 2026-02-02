import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from '../packages/entities/transaction.entity';
import { ClientProgressPhoto } from './entities/client-progress-photo.entity';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ClientProgressPhoto)
    private readonly photoRepository: Repository<ClientProgressPhoto>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(tenantId: string, search?: string): Promise<Client[]> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.studio', 'studio')
      .leftJoinAndSelect('client.user', 'user')
      .where('client.tenantId = :tenantId', { tenantId })
      .andWhere('client.status = :status', { status: 'active' });

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('client.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('client.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('client.email ILIKE :search', { search: `%${search}%` })
            .orWhere('client.phone ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    query
      .orderBy('client.lastName', 'ASC')
      .addOrderBy('client.firstName', 'ASC');

    return query.getMany();
  }

  async findOne(
    id: string,
    tenantId: string,
    relations: string[] = [],
  ): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, tenantId },
      relations,
    });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async findByUserId(userId: string, tenantId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { userId, tenantId },
    });
  }

  async getTransactions(
    clientId: string,
    tenantId: string,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { clientId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async adjustBalance(
    clientId: string,
    tenantId: string,
    amount: number,
    description: string,
    userId: string,
  ): Promise<Client> {
    const client = await this.findOne(clientId, tenantId);

    // Update Balance
    // If amount > 0, we are adding funds (Client pays Studio) -> Credit Increases
    // If amount < 0, we are removing funds/refunding -> Credit Decreases
    const newBalance = Number(client.creditBalance || 0) + amount;
    client.creditBalance = newBalance;

    await this.clientRepository.save(client);

    // Create Transaction
    const transaction = this.transactionRepository.create({
      tenantId,
      clientId: client.id,
      studioId: undefined, // Optional, maybe allow passing it?
      type: amount > 0 ? TransactionType.INCOME : TransactionType.REFUND,
      amount: amount,
      category: TransactionCategory.MANUAL_ADJUSTMENT,
      description: description || 'Manual Balance Adjustment',
      createdBy: userId,
      runningBalance: newBalance,
    });

    await this.transactionRepository.save(transaction);

    await this.auditService.log(
      tenantId,
      'MANUAL_BALANCE_ADJUSTMENT',
      'Client',
      clientId,
      userId,
      { amount, description, newBalance },
    );

    return client;
  }

  async create(dto: CreateClientDto, tenantId: string): Promise<Client> {
    const client = this.clientRepository.create({
      ...dto,
      tenantId,
    });
    return this.clientRepository.save(client);
  }

  async createWithUser(dto: any, tenantId: string): Promise<Client> {
    // Check if email already exists
    const existingUser = await this.authService.findByEmail(
      dto.email,
      tenantId,
    );
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // Create user account with transaction
    const user = await this.authService.createClientUser(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'client',
        gender: dto.gender,
      } as any,
      tenantId,
    );

    // Create client profile linked to user
    const client = this.clientRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      status: dto.status || 'active',
      userId: user.id,
      studioId: dto.studioId || null,
      tenantId,
    });

    return this.clientRepository.save(client);
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    tenantId: string,
  ): Promise<Client> {
    const client = await this.findOne(id, tenantId, ['user']);

    // Extract gender from dto (it goes to the user, not client)
    const { gender, ...clientDto } = dto;

    // Calculate diff before update (excluding gender since it's on user)
    const updatedClient = { ...client, ...clientDto };
    const { changes } = this.auditService.calculateDiff(client, updatedClient);

    Object.assign(client, clientDto);
    const saved = await this.clientRepository.save(client);

    // Update user gender if provided and client has a linked user
    if (gender && client.userId) {
      await this.userRepository.update(client.userId, { gender });
    }

    if (Object.keys(changes).length > 0 || gender) {
      await this.auditService.log(
        tenantId,
        'UPDATE_CLIENT',
        'Client',
        client.id,
        'API_USER', // TODO: Pass actual user ID
        { changes, ...(gender ? { userGender: gender } : {}) },
      );
    }

    return saved;
  }

  async remove(
    id: string,
    tenantId: string,
    userId: string = 'API_USER',
  ): Promise<void> {
    const client = await this.findOne(id, tenantId);
    // Soft delete by setting status to inactive
    client.status = 'inactive';
    await this.clientRepository.save(client);

    await this.auditService.log(
      tenantId,
      'UPDATE_CLIENT', // Or DELETE_CLIENT if we want to distinguish soft delete
      'Client',
      client.id,
      userId,
      {
        changes: { status: { from: 'active', to: 'inactive' } },
        message: 'Client soft deleted',
      },
    );
  }

  async invite(id: string, tenantId: string): Promise<void> {
    const client = await this.findOne(id, tenantId);

    if (!client.email) {
      throw new Error('Client does not have an email address');
    }

    if (client.userId) {
      throw new Error('Client already has a user account linked');
    }

    let user = await this.authService.findByEmail(client.email, tenantId);

    if (user) {
      // User exists, verify role
      if (user.role !== 'client') {
        throw new Error(
          `Email is already registered as a ${user.role}. Cannot link to client profile.`,
        );
      }
      // User exists as client, ready to link
    } else {
      // Create New Client User
      const tempPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      user = await this.authService.createClientUser(
        {
          email: client.email,
          password: tempPassword,
          firstName: client.firstName,
          lastName: client.lastName,
          role: 'client',
          gender: (client as any).gender || 'other',
        } as any,
        tenantId,
      );
    }

    if (!user) {
      throw new Error('Failed to retrieve or create user');
    }

    // Update Client with userId
    client.userId = user.id;
    await this.clientRepository.save(client);

    // Generate Invite Token
    const token = this.authService.generateInviteToken({
      id: user.id,
      email: user.email,
      tenantId,
    });

    // Send Email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/auth/setup?token=${token}`;

    await this.mailerService.sendClientInvitation(client.email, inviteLink);
  }

  async addProgressPhoto(
    clientId: string,
    dto: CreateProgressPhotoDto,
    tenantId: string,
  ): Promise<ClientProgressPhoto> {
    const client = await this.findOne(clientId, tenantId);

    const photo = this.photoRepository.create({
      ...dto,
      clientId: client.id,
      tenantId,
    });

    return this.photoRepository.save(photo);
  }

  async getProgressPhotos(
    clientId: string,
    tenantId: string,
  ): Promise<ClientProgressPhoto[]> {
    // Ensure client exists and belongs to tenant
    await this.findOne(clientId, tenantId);

    return this.photoRepository.find({
      where: { clientId, tenantId },
      order: { takenAt: 'DESC' },
    });
  }

  async deleteProgressPhoto(
    clientId: string,
    photoId: string,
    tenantId: string,
  ): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId, clientId, tenantId },
    });

    if (!photo) {
      throw new NotFoundException('Progress photo not found');
    }

    await this.photoRepository.remove(photo);
  }
}
