import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AutomationRule,
  AutomationTriggerType,
  AutomationActionType,
} from './entities/automation-rule.entity';
import {
  AutomationExecution,
  AutomationExecutionStatus,
} from './entities/automation-execution.entity';
import { MailerService } from '../mailer/mailer.service';
import { UsageTrackingService } from '../owner/services/usage-tracking.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(AutomationRule)
    private ruleRepository: Repository<AutomationRule>,
    @InjectRepository(AutomationExecution)
    private executionRepository: Repository<AutomationExecution>,
    private mailerService: MailerService,
    private usageTrackingService: UsageTrackingService,
    private whatsappService: WhatsAppService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: any, tenantId: string): Promise<AutomationRule> {
    const rule = this.ruleRepository.create({
      ...createDto,
      tenantId,
    });
    return (await this.ruleRepository.save(rule)) as unknown as AutomationRule;
  }

  async findAll(tenantId: string): Promise<AutomationRule[]> {
    return this.ruleRepository.find({
      where: { tenantId },
    });
  }

  async findAllExecutions(
    tenantId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    data: AutomationExecution[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await this.executionRepository.findAndCount({
      where: { tenantId },
      relations: ['rule'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async update(
    id: string,
    updateDto: any,
    tenantId: string,
  ): Promise<AutomationRule> {
    await this.ruleRepository.update({ id, tenantId }, updateDto);
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`AutomationRule with ID ${id} not found`);
    }
    return rule;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.ruleRepository.delete({ id, tenantId });
  }

  async triggerEvent(type: AutomationTriggerType, context: any) {
    this.logger.log(
      `Trigger event received: ${type} for entity ${context.clientId || 'unknown'}`,
    );

    // Extract tenantId from context
    const tenantId =
      context.tenantId ||
      (context.client ? context.client.tenantId : null) ||
      (context.lead ? context.lead.tenantId : null);

    if (!tenantId) {
      this.logger.warn(
        `Trigger event ${type} missing tenantId context.Skipping automation.`,
      );
      return;
    }

    // Find active rules for this trigger type and tenant
    const rules = await this.ruleRepository.find({
      where: { triggerType: type, isActive: true, tenantId },
    });

    for (const rule of rules) {
      await this.createExecution(rule, context, tenantId);
    }
  }

  private async createExecution(
    rule: AutomationRule,
    context: any,
    tenantId: string,
  ) {
    let firstStepDelay = 0;
    if (rule.actions && rule.actions.length > 0) {
      // Sort by order just in case
      rule.actions.sort((a: any, b: any) => a.order - b.order);
      firstStepDelay = (rule.actions[0].delayMinutes || 0) * 60 * 1000;
    }

    const execution = this.executionRepository.create({
      ruleId: rule.id,
      tenantId, // Use explicit tenantId
      entityId: context.clientId || context.leadId || 'unknown',
      context: context,
      currentStepIndex: 0,
      status: AutomationExecutionStatus.PENDING,
      nextRunAt: new Date(Date.now() + firstStepDelay),
    });

    await this.executionRepository.save(execution);

    // Record usage metric
    await this.usageTrackingService.recordMetric(
      tenantId,
      'automation_executions',
      1,
      'daily',
      { ruleId: rule.id, executionId: execution.id },
    );

    this.logger.log(`Created execution ${execution.id} for rule ${rule.name}`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingExecutions() {
    this.logger.debug('Checking for pending automation executions...');

    const pending = await this.executionRepository.find({
      where: {
        status: AutomationExecutionStatus.PENDING,
        nextRunAt: LessThanOrEqual(new Date()),
      },
      relations: ['rule'],
    });

    if (pending.length > 0) {
      this.logger.log(`Found ${pending.length} pending executions`);
    }

    for (const execution of pending) {
      await this.executeStep(execution);
    }
  }

  private async executeStep(execution: AutomationExecution) {
    const rule = execution.rule;
    if (!rule || !rule.actions || rule.actions.length === 0) {
      execution.status = AutomationExecutionStatus.COMPLETED;
      await this.executionRepository.save(execution);
      return;
    }

    const actions = rule.actions.sort((a: any, b: any) => a.order - b.order);
    const currentAction = actions[execution.currentStepIndex];

    if (!currentAction) {
      // No more steps
      execution.status = AutomationExecutionStatus.COMPLETED;
      await this.executionRepository.save(execution);
      return;
    }

    try {
      await this.performAction(
        currentAction.type,
        currentAction.payload,
        execution.context,
      );

      // Move to next step
      execution.currentStepIndex++;
      if (execution.currentStepIndex < actions.length) {
        const nextAction = actions[execution.currentStepIndex];
        const delayMs = (nextAction.delayMinutes || 0) * 60 * 1000;
        execution.nextRunAt = new Date(Date.now() + delayMs);
      } else {
        execution.status = AutomationExecutionStatus.COMPLETED;
      }
    } catch (error) {
      this.logger.error(
        `Failed to execute step for execution ${execution.id}`,
        error,
      );
      execution.status = AutomationExecutionStatus.FAILED;
    }

    await this.executionRepository.save(execution);
  }

  private async performAction(
    type: AutomationActionType | string,
    payload: any,
    context: any,
  ) {
    this.logger.log(`[Automation] EXECUTING Action: ${type} `, payload);

    // Variable replacement helper
    const replaceVars = (str: string) => {
      if (!str) return str;
      const userName =
        context.client?.firstName ||
        context.client?.name ||
        context.user?.firstName ||
        context.lead?.firstName ||
        context.lead?.name ||
        'Customer';

      return str
        .replace(/{{userName}}/g, userName)
        .replace(/{{clientName}}/g, context.client?.firstName || userName)
        .replace(/{{leadName}}/g, context.lead?.firstName || userName)
        .replace(/{{client.email}}/g, context.client?.email || '')
        .replace(/{{lead.email}}/g, context.lead?.email || '')
        .replace(
          /{{sessionTime}}/g,
          context.session?.startTime
            ? new Date(context.session.startTime).toLocaleString()
            : 'your session time',
        )
        .replace(/{{studioName}}/g, context.studio?.name || 'EMS Studio')
        .replace(/{{portalUrl}}/g, 'http://localhost:5173');
    };

    if (type === AutomationActionType.SEND_EMAIL) {
      const recipient =
        context.email ||
        (context.client ? context.client.email : null) ||
        (context.lead ? context.lead.email : null);

      if (!recipient) {
        this.logger.warn(
          'No recipient email found in context for SEND_EMAIL action',
        );
        return;
      }

      const templateId =
        payload.templateId || payload.templateName || payload.template;

      let result;
      if (templateId) {
        result = await this.mailerService.sendTemplatedMail(
          recipient,
          templateId,
          context,
        );
      } else {
        const subject = replaceVars(
          payload.subject || 'Notification from EMS Studio',
        );
        const body = replaceVars(payload.body || payload.text || 'No content');
        const htmlBody = replaceVars(
          payload.htmlBody || `<html><body>${body}</body></html>`,
        );

        result = await this.mailerService.sendMail(
          recipient,
          subject,
          body,
          htmlBody,
        );
      }

      if (!result) {
        throw new Error(`Failed to send email to ${recipient}`);
      }
    }

    if (type === AutomationActionType.SEND_WHATSAPP) {
      const recipient =
        context.phone ||
        (context.client ? context.client.phone : null) ||
        (context.lead ? context.lead.phone : null);

      if (!recipient) {
        this.logger.warn(
          'No recipient phone found in context for SEND_WHATSAPP action',
        );
        return;
      }

      if (payload.templateName) {
        // Replace variables in components
        const processedComponents =
          payload.components?.map((comp: any) => ({
            ...comp,
            parameters: comp.parameters?.map((param: any) => ({
              ...param,
              text:
                param.type === 'text' ? replaceVars(param.text) : param.text,
            })),
          })) || [];

        await this.whatsappService.sendTemplateMessage(
          context.tenantId,
          recipient,
          payload.templateName,
          processedComponents,
        );
      } else {
        const body =
          payload.body || payload.text || 'Notification from EMS Studio';
        await this.whatsappService.sendFreeFormMessage(
          context.tenantId,
          recipient,
          replaceVars(body),
        );
      }
    }

    if (type === AutomationActionType.SEND_NOTIFICATION) {
      const userId =
        context.userId ||
        (context.client ? context.client.userId : null) ||
        (context.user ? context.user.id : null);

      if (userId && context.tenantId) {
        await this.notificationsService.createNotification({
          userId,
          tenantId: context.tenantId,
          title: replaceVars(payload.title || 'Notification'),
          message: replaceVars(
            payload.message || payload.body || 'You have a new notification',
          ),
          type: payload.type || 'info',
          data: payload.data || {},
        });
      } else {
        this.logger.warn(
          'No userId or tenantId found in context for SEND_NOTIFICATION action',
        );
      }
    }

    // SMS implementation would go here
  }

  async getGlobalStats(): Promise<{
    totalExecutions: number;
    activeRules: number;
    failedExecutions: number;
    executionsToday: number;
  }> {
    const totalExecutions = await this.executionRepository.count();
    const activeRules = await this.ruleRepository.count({
      where: { isActive: true },
    });
    const failedExecutions = await this.executionRepository.count({
      where: { status: AutomationExecutionStatus.FAILED },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const executionsToday = await this.executionRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });

    return {
      totalExecutions,
      activeRules,
      failedExecutions,
      executionsToday,
    };
  }
}
