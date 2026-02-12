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
import {
  ClientDocument,
  DocumentCategory,
} from './entities/client-document.entity';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/entities/user.entity';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';
import { Session } from '../sessions/entities/session.entity';
import { StorageService } from '../storage/storage.service';
import { TenantsService } from '../tenants/tenants.service';

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
    @InjectRepository(FavoriteCoach)
    private readonly favoriteCoachRepository: Repository<FavoriteCoach>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(ClientDocument)
    private readonly documentRepository: Repository<ClientDocument>,
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly tenantsService: TenantsService,
  ) { }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    search?: string,
    sortBy: string = 'lastName',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    studioId?: string,
  ): Promise<{ data: Client[]; total: number; page: number; limit: number }> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.studio', 'studio')
      .leftJoinAndSelect('client.user', 'user')
      .where('client.tenantId = :tenantId', { tenantId })
      .andWhere('client.status = :status', { status: 'active' });

    if (studioId) {
      query.andWhere('client.studioId = :studioId', { studioId });
    }

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

    const sortField = sortBy.includes('.') ? sortBy : `client.${sortBy}`;
    query.orderBy(sortField, sortOrder);

    // Secondary sort by ID to ensure stable pagination
    query.addOrderBy('client.id', 'ASC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(
    id: string,
    tenantId: string,
    relations: string[] = [],
  ): Promise<Client> {
    // Use query builder to ensure relations are properly loaded
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.id = :id', { id })
      .andWhere('client.tenantId = :tenantId', { tenantId });

    // Add relations
    if (relations.includes('user')) {
      queryBuilder.leftJoinAndSelect('client.user', 'user');
    }
    if (relations.includes('studio')) {
      queryBuilder.leftJoinAndSelect('client.studio', 'studio');
    }

    const client = await queryBuilder.getOne();
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
      // Update in-memory user object so the response reflects the change
      if (client.user) {
        client.user.gender = gender;
      }
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

  async bulkDelete(ids: string[], tenantId: string): Promise<void> {
    if (!ids.length) return;

    // Use query builder for bulk update to avoid loading all entities
    await this.clientRepository
      .createQueryBuilder()
      .update(Client)
      .set({ status: 'inactive' })
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();

    // Log the bulk action
    await this.auditService.log(
      tenantId,
      'BULK_DELETE_CLIENTS',
      'Client',
      'BULK',
      'API_USER', // TODO: Get actual user from context if possible or pass it down
      {
        ids,
        count: ids.length,
        action: 'soft_delete',
      },
    );
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

    // Fetch tenant settings for email config
    const tenant = await this.tenantsService.findOne(tenantId);
    await this.mailerService.sendClientInvitation(client.email, inviteLink, tenant.settings?.emailConfig);
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

  async getFavoriteCoach(
    clientId: string,
    tenantId: string,
  ): Promise<any | null> {
    // Ensure client exists
    await this.findOne(clientId, tenantId);

    // Get the most recently favorited coach
    const favorite = await this.favoriteCoachRepository.findOne({
      where: { clientId, tenantId },
      relations: ['coach', 'coach.user'],
      order: { favoritedAt: 'DESC' },
    });

    if (favorite && favorite.coach) {
      return {
        id: favorite.coach.id,
        firstName: favorite.coach.user?.firstName || '',
        lastName: favorite.coach.user?.lastName || '',
        name: favorite.coach.user
          ? `${favorite.coach.user.firstName} ${favorite.coach.user.lastName}`
          : 'Unknown Coach',
        avatarUrl: favorite.coach.user?.avatarUrl || null,
        favoritedAt: favorite.favoritedAt,
        isFavorite: true,
      };
    }

    // If no favorite coach, get the most frequently assigned coach from sessions
    const mostAssignedCoach = await this.sessionRepository
      .createQueryBuilder('session')
      .select('session.coachId', 'coachId')
      .addSelect('coach.id', 'id')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('user.avatarUrl', 'avatarUrl')
      .addSelect('COUNT(*)', 'sessionCount')
      .leftJoin('session.coach', 'coach')
      .leftJoin('coach.user', 'user')
      .where('session.clientId = :clientId', { clientId })
      .andWhere('session.tenantId = :tenantId', { tenantId })
      .andWhere('session.coachId IS NOT NULL')
      .groupBy('session.coachId')
      .addGroupBy('coach.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .addGroupBy('user.avatarUrl')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    if (!mostAssignedCoach || !mostAssignedCoach.coachId) {
      return null;
    }

    const firstName = mostAssignedCoach.firstName || '';
    const lastName = mostAssignedCoach.lastName || '';
    const name =
      firstName && lastName ? `${firstName} ${lastName}` : 'Unknown Coach';

    return {
      id: mostAssignedCoach.coachId,
      firstName,
      lastName,
      name,
      avatarUrl: mostAssignedCoach.avatarUrl || null,
      sessionCount: parseInt(mostAssignedCoach.sessionCount, 10),
      isFavorite: false,
    };
  }

  async getMostUsedRoom(
    clientId: string,
    tenantId: string,
  ): Promise<{ roomId: string; roomName: string; usageCount: number } | null> {
    // Ensure client exists
    await this.findOne(clientId, tenantId);

    // Query sessions for this client and count room usage
    const roomUsage = await this.sessionRepository
      .createQueryBuilder('session')
      .select('session.roomId', 'roomId')
      .addSelect('room.name', 'roomName')
      .addSelect('COUNT(*)', 'usageCount')
      .leftJoin('session.room', 'room')
      .where('session.clientId = :clientId', { clientId })
      .andWhere('session.tenantId = :tenantId', { tenantId })
      .andWhere('session.roomId IS NOT NULL')
      .groupBy('session.roomId')
      .addGroupBy('room.name')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    if (!roomUsage || !roomUsage.roomId) {
      return null;
    }

    return {
      roomId: roomUsage.roomId,
      roomName: roomUsage.roomName || 'Unknown Room',
      usageCount: parseInt(roomUsage.usageCount, 10),
    };
  }

  // ==================== Document Management ====================

  async uploadDocument(
    clientId: string,
    tenantId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    category: DocumentCategory = DocumentCategory.OTHER,
  ): Promise<ClientDocument> {
    // Verify client exists
    await this.findOne(clientId, tenantId);

    // Upload to MinIO
    const storagePath = `${tenantId}/clients/${clientId}`;
    const fileUrl = await this.storageService.uploadFile(file, storagePath);

    // Create document record
    const document = this.documentRepository.create({
      clientId,
      tenantId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      fileUrl,
      uploadedBy,
      category,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Audit log
    await this.auditService.log(
      tenantId,
      'client_document_uploaded',
      'client_document',
      savedDocument.id,
      uploadedBy,
      {
        clientId,
        fileName: file.originalname,
        fileSize: file.size,
        category,
      },
    );

    return savedDocument;
  }

  async getClientDocuments(
    clientId: string,
    tenantId: string,
    category?: DocumentCategory,
  ): Promise<ClientDocument[]> {
    const query = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploader', 'uploader')
      .where('document.clientId = :clientId', { clientId })
      .andWhere('document.tenantId = :tenantId', { tenantId });

    if (category) {
      query.andWhere('document.category = :category', { category });
    }

    query.orderBy('document.createdAt', 'DESC');

    return query.getMany();
  }

  async deleteDocument(
    documentId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Delete from MinIO (optional - you might want to keep for audit)
    // await this.storageService.deleteFile(document.fileUrl);

    // Delete from database
    await this.documentRepository.remove(document);

    // Audit log
    await this.auditService.log(
      tenantId,
      'client_document_deleted',
      'client_document',
      documentId,
      userId,
      {
        clientId: document.clientId,
        fileName: document.fileName,
      },
    );
  }

  async getDocumentDownloadUrl(
    documentId: string,
    tenantId: string,
  ): Promise<{ url: string; fileName: string }> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // For now, return the storage key - in production, generate a signed URL
    return {
      url: `/api/clients/${document.clientId}/documents/${documentId}/download`,
      fileName: document.fileName,
    };
  }

  async streamDocument(
    documentId: string,
    tenantId: string,
  ): Promise<{ stream: any; fileName: string; contentType: string }> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const stream = await this.storageService.getFile(document.fileUrl);

    return {
      stream,
      fileName: document.fileName,
      contentType: document.fileType,
    };
  }
}
