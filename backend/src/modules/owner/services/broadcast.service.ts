import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  BroadcastMessage,
  BroadcastStatus,
  BroadcastType,
  BroadcastAudience,
} from '../entities/broadcast-message.entity';
import { MailerService } from '../../mailer/mailer.service';
import { User } from '../../auth/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Client } from '../../clients/entities/client.entity';
import { OwnerAuditService } from './owner-audit.service';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(BroadcastMessage)
    private broadcastRepo: Repository<BroadcastMessage>,
    @InjectRepository(User)
    private userRepo: Repository<User>, // For Tenant Owners
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(Coach)
    private coachRepo: Repository<Coach>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private mailerService: MailerService,
    private auditService: OwnerAuditService,
  ) {}

  async create(
    createDto: Partial<BroadcastMessage>,
    ownerId: string,
  ): Promise<BroadcastMessage> {
    const broadcast = this.broadcastRepo.create({
      ...createDto,
      body: createDto.body || '', // Ensure body is not undefined
      createdBy: ownerId,
      status: BroadcastStatus.DRAFT,
    });
    return this.broadcastRepo.save(broadcast);
  }

  async findAll(): Promise<BroadcastMessage[]> {
    return this.broadcastRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getHistory(): Promise<BroadcastMessage[]> {
    return this.broadcastRepo.find({
      where: {
        status: In([
          BroadcastStatus.SENT,
          BroadcastStatus.FAILED,
          BroadcastStatus.SCHEDULED,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async send(
    id: string,
    ownerId: string,
    ip: string,
  ): Promise<BroadcastMessage> {
    const broadcast = await this.broadcastRepo.findOne({ where: { id } });
    if (!broadcast) throw new BadRequestException('Broadcast not found');
    if (broadcast.status === BroadcastStatus.SENT)
      throw new BadRequestException('Already sent');

    broadcast.status = BroadcastStatus.SENDING;
    await this.broadcastRepo.save(broadcast);

    await this.auditService.logAction(
      ownerId,
      'BROADCAST_MESSAGE',
      {
        broadcastId: broadcast.id,
        subject: broadcast.subject,
        audience: broadcast.targetAudience,
      },
      undefined,
      ip,
    );

    // Async processing
    this.processBroadcast(broadcast).catch((err) => {
      this.logger.error(`Failed to process broadcast ${broadcast.id}`, err);
      broadcast.status = BroadcastStatus.FAILED;
      this.broadcastRepo.save(broadcast);
    });

    return broadcast;
  }

  private async processBroadcast(broadcast: BroadcastMessage) {
    let recipients: { email: string; name?: string }[] = [];

    // 1. Fetch Recipients
    switch (broadcast.targetAudience) {
      case BroadcastAudience.ALL_TENANTS:
      case BroadcastAudience.TENANT_OWNERS:
        // Fetch all users with 'tenant_owner' role
        // Simplified: Fetch all users linked to a tenant who are not deleted
        // Better: Fetch users with role 'tenant_owner'
        const owners = await this.userRepo
          .createQueryBuilder('user')
          .innerJoinAndSelect('user.roles', 'role', 'role.name = :roleName', {
            roleName: 'tenant_owner',
          })
          .getMany();
        recipients = owners
          .filter((u) => u.email)
          .map((u) => ({ email: u.email, name: u.fullName }));
        break;

      case BroadcastAudience.ALL_COACHES:
        const coaches = await this.coachRepo.find({ relations: ['user'] });
        recipients = coaches
          .filter((c) => c.user && c.user.email)
          .map((c) => ({ email: c.user.email, name: c.user.fullName }));
        break;

      case BroadcastAudience.ALL_CLIENTS:
        const clients = await this.clientRepo.find({
          select: ['email', 'firstName', 'lastName'],
        });
        recipients = clients
          .filter((c) => c.email)
          .map((c) => ({
            email: c.email!,
            name: `${c.firstName} ${c.lastName}`,
          }));
        break;
    }

    this.logger.log(
      `Sending broadcast ${broadcast.id} to ${recipients.length} recipients`,
    );

    // 2. Send Messages
    let successCount = 0;
    let failureCount = 0;

    if (broadcast.type === BroadcastType.EMAIL) {
      // Batch send to avoid overwhelming mailer
      // For now, simple loop
      for (const recipient of recipients) {
        try {
          await this.mailerService.sendMail(
            recipient.email,
            broadcast.subject || 'System Announcement',
            broadcast.body,
            `<p>${broadcast.body.replace(/\n/g, '<br>')}</p>`,
          );
          successCount++;
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send to ${recipient.email}`, error);
        }
      }
    }

    // 3. Update Status
    broadcast.status = BroadcastStatus.SENT;
    broadcast.sentAt = new Date();
    broadcast.stats = {
      totalRecipients: recipients.length,
      successCount,
      failureCount,
    };

    await this.broadcastRepo.save(broadcast);
  }
}
