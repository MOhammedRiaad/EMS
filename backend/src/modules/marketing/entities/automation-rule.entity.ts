import { Entity, Column } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';

export enum AutomationTriggerType {
  NEW_LEAD = 'new_lead',
  INACTIVE_CLIENT = 'inactive_client', // e.g., no session in X days
  BIRTHDAY = 'birthday',
  SESSION_COMPLETED = 'session_completed',
  SESSION_REMINDER = 'session_reminder',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
}

export enum AutomationActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_NOTIFICATION = 'send_notification',
  CREATE_TASK = 'create_task',
  UPDATE_STATUS = 'update_status',
}

@Entity('automation_rules')
export class AutomationRule extends TenantScopedEntityWithUpdate {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AutomationTriggerType,
  })
  triggerType: AutomationTriggerType;

  // JSON column to store trigger conditions (e.g., { daysSinceLastSession: 30 })
  @Column({ type: 'jsonb', nullable: true })
  conditions: any;

  @Column({
    type: 'enum',
    enum: AutomationActionType,
    nullable: true,
  })
  actionType: AutomationActionType;

  // JSON column to store action details (e.g., { templateId: 'welcome_email', subject: 'Hi' })
  @Column({ type: 'jsonb', nullable: true })
  actionPayload: any;

  // Multi-step actions for drip campaigns
  // Structure: Array<{ type: AutomationActionType, delayMinutes: number, payload: any, order: number }>
  @Column({ type: 'jsonb', nullable: true })
  actions: any;

  @Column({ default: true })
  isActive: boolean;
}
