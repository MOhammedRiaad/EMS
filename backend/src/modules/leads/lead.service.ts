import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import {
  LeadActivity,
  LeadActivityType,
} from './entities/lead-activity.entity';
import { User } from '../auth/entities/user.entity';

import { ClientsService } from '../clients/clients.service';
import { AutomationService } from '../marketing/automation.service';
import { AutomationTriggerType } from '../marketing/entities/automation-rule.entity';
import { SessionsService } from '../sessions/sessions.service';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private activityRepository: Repository<LeadActivity>,
    private readonly clientsService: ClientsService,
    private readonly automationService: AutomationService,
    private readonly sessionsService: SessionsService,
    private readonly packagesService: PackagesService,
  ) { }

  async create(
    createLeadDto: any,
    tenantId: string,
    user?: User,
  ): Promise<Lead> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required to create a lead');
    }

    const lead = this.leadRepository.create({
      ...createLeadDto,
      status: LeadStatus.NEW,
      tenantId,
    });
    const savedLead = (await this.leadRepository.save(lead)) as unknown as Lead;

    if (savedLead.id) {
      await this.logActivity(
        savedLead.id,
        LeadActivityType.NOTE,
        'Lead created',
        user,
      );
      // Trigger Automation
      await this.automationService.triggerEvent(
        AutomationTriggerType.NEW_LEAD,
        { lead: savedLead, tenantId: savedLead.tenantId },
      );
    }

    return savedLead;
  }

  async findAll(filter: any, tenantId: string): Promise<Lead[]> {
    const query = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedTo', 'assignedTo')
      .where('lead.tenantId = :tenantId', { tenantId })
      .orderBy('lead.createdAt', 'DESC');

    if (filter.status) {
      query.andWhere('lead.status = :status', { status: filter.status });
    }

    if (filter.studioId) {
      query.andWhere('lead.studioId = :studioId', {
        studioId: filter.studioId,
      });
    }

    if (filter.source) {
      query.andWhere('lead.source = :source', { source: filter.source });
    }

    if (filter.search) {
      query.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
      relations: ['activities', 'activities.createdBy', 'assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(
    id: string,
    updateLeadDto: any,
    tenantId: string,
    user?: User,
  ): Promise<Lead> {
    if (!tenantId) throw new BadRequestException('Tenant context required');

    const lead = await this.findOne(id, tenantId);

    if (updateLeadDto.status && updateLeadDto.status !== lead.status) {
      await this.logActivity(
        id,
        LeadActivityType.STATUS_CHANGED,
        `Status changed from ${lead.status} to ${updateLeadDto.status}`,
        user,
      );
      // Trigger Automation
      await this.automationService.triggerEvent(
        AutomationTriggerType.LEAD_STATUS_CHANGED,
        {
          lead,
          oldStatus: lead.status,
          newStatus: updateLeadDto.status,
          tenantId: lead.tenantId,
        },
      );
    }

    // Handle studio assignment logic if needed: "lead should be assigned to studio after contacted"
    if (
      updateLeadDto.status === LeadStatus.CONTACTED &&
      !lead.studioId &&
      updateLeadDto.studioId
    ) {
      // Logic is handled by just updating the field if passed in updateLeadDto
    }

    // Use update instead of save to avoid issues with loaded relations (orphaning new activities)
    // Ensure we don't overwrite tenantId
    delete updateLeadDto.tenantId;

    await this.leadRepository.update({ id, tenantId }, updateLeadDto);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.leadRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException('Lead not found');
    }
  }

  async addActivity(
    leadId: string,
    type: LeadActivityType,
    content: string,
    user?: User,
  ) {
    return this.logActivity(leadId, type, content, user);
  }

  private async logActivity(
    leadId: string,
    type: LeadActivityType,
    content: string,
    user?: User,
  ) {
    const activity = this.activityRepository.create({
      lead: { id: leadId } as Lead,
      type,
      content,
      createdBy: user,
    });
    return this.activityRepository.save(activity);
  }

  async bookTrial(leadId: string, dto: any, user: User) {
    const lead = await this.findOne(leadId, user.tenantId);

    // Book session via SessionsService
    // Assuming dto is CreateSessionDto but we inject leadId
    const sessionDto = { ...dto, leadId, clientId: undefined };
    const session = await this.sessionsService.create(
      sessionDto,
      user.tenantId,
      user,
    );

    // Update status to TRIAL_BOOKED if not already converted or higher
    if (
      lead.status !== LeadStatus.CONVERTED &&
      lead.status !== LeadStatus.TRIAL_BOOKED
    ) {
      await this.update(
        leadId,
        { status: LeadStatus.TRIAL_BOOKED },
        user.tenantId,
        user,
      );
    }

    await this.logActivity(
      leadId,
      LeadActivityType.NOTE,
      `Trial Session Booked: ${session.startTime}`,
      user,
    );

    return session;
  }

  async assignPackage(leadId: string, dto: any, user: User) {
    const lead = await this.findOne(leadId, user.tenantId);

    // Assign package via PackagesService
    // DTO expects clientId or leadId
    const assignDto = { ...dto, leadId, clientId: undefined };
    const clientPackage = await this.packagesService.assignPackage(
      assignDto,
      user.tenantId,
      user.id,
    );

    await this.logActivity(
      leadId,
      LeadActivityType.NOTE,
      `Trial Package Assigned: ${clientPackage.packageId}`, // Improve logging to show package name if possible
      user,
    );

    return clientPackage;
  }

  // Conversion Logic
  async convertToClient(id: string, user?: User): Promise<any> {
    if (!user || !user.tenantId) {
      throw new BadRequestException(
        'Cannot convert lead without tenant context',
      );
    }
    const lead = await this.findOne(id, user.tenantId);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead already converted');
    }

    // 1. Create Client User + Profile
    // We need a tenantId. Assuming the acting user has one, or the lead implies one.
    // The lead itself doesn't have a tenantId column shown in entity file (implied global or tenant-aware).
    // BUT LeadService methods don't take tenantId context usually?
    // Wait, `user` param has `tenantId`. We should use that.

    if (!user || !user.tenantId) {
      throw new BadRequestException(
        'Cannot convert lead without tenant context',
      );
    }

    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);

    let client;
    try {
      client = await this.clientsService.createWithUser(
        {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          password: tempPassword,
          status: 'active',
          // gender? Lead doesn't have gender. Default to 'other' or undefined?
          gender: 'other',
        },
        user.tenantId,
      );
    } catch (e) {
      throw new BadRequestException(`Failed to create client: ${e.message}`);
    }

    // 2. Send Invitation
    try {
      await this.clientsService.invite(client.id, user.tenantId);
    } catch (e) {
      console.warn('Failed to send invitation email during conversion', e);
      // Don't fail the whole process if email fails, but log it.
    }

    lead.status = LeadStatus.CONVERTED;
    await this.leadRepository.save(lead);

    await this.logActivity(
      id,
      LeadActivityType.STATUS_CHANGED,
      'Lead converted to Client',
      user,
    );

    return {
      message: 'Lead converted successfully',
      lead,
      client,
    };
  }
}
