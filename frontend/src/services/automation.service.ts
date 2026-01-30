import { api } from './api';

export const AutomationTriggerType = {
    NEW_LEAD: 'new_lead',
    INACTIVE_CLIENT: 'inactive_client',
    BIRTHDAY: 'birthday',
    SESSION_COMPLETED: 'session_completed',
    LEAD_STATUS_CHANGED: 'lead_status_changed'
} as const;

export type AutomationTriggerType = typeof AutomationTriggerType[keyof typeof AutomationTriggerType];

export const AutomationActionType = {
    SEND_EMAIL: 'send_email',
    SEND_SMS: 'send_sms',
    CREATE_TASK: 'create_task',
    UPDATE_STATUS: 'update_status'
} as const;

export type AutomationActionType = typeof AutomationActionType[keyof typeof AutomationActionType];

export interface AutomationRule {
    id: string;
    name: string;
    triggerType: AutomationTriggerType;
    conditions: any;
    actionType?: AutomationActionType;
    actionPayload?: any;
    actions?: { id: string; type: AutomationActionType; delayMinutes: number; payload: any; order: number }[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAutomationRuleDto {
    name: string;
    triggerType: AutomationTriggerType;
    conditions?: any;
    actionType?: AutomationActionType;
    actionPayload?: any;
    actions?: { id: string; type: AutomationActionType; delayMinutes: number; payload: any; order: number }[];
    isActive?: boolean;
}

export const automationService = {
    async getAll() {
        const res = await api.get<AutomationRule[]>('/marketing/automations');
        return res.data;
    },

    async getOne(id: string) {
        const res = await api.get<AutomationRule>(`/marketing/automations/${id}`);
        return res.data;
    },

    async create(data: CreateAutomationRuleDto) {
        const res = await api.post<AutomationRule>('/marketing/automations', data);
        return res.data;
    },

    async update(id: string, data: Partial<CreateAutomationRuleDto>) {
        const res = await api.patch<AutomationRule>(`/marketing/automations/${id}`, data);
        return res.data;
    },

    async getExecutions() {
        const res = await api.get<AutomationExecution[]>('/marketing/automations/executions');
        return res.data;
    },



    async delete(id: string) {
        await api.delete(`/marketing/automations/${id}`);
    }
};

export interface AutomationExecution {
    id: string;
    ruleId: string;
    rule: AutomationRule;
    entityId: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    currentStepIndex: number;
    nextRunAt: string;
    createdAt: string;
}
