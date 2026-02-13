import { authenticatedFetch } from './api';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'other';

export interface TicketMessage {
    id: string;
    ticketId: string;
    userId: string;
    message: string;
    createdAt: string;
    user?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
}

export interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory;
    tenantId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    messages?: TicketMessage[];
    user?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    tenant?: {
        id: string;
        name: string;
    };
}

export interface CreateTicketDto {
    subject: string;
    message: string;
    priority: TicketPriority;
    category: TicketCategory;
}

export interface CreateMessageDto {
    message: string;
}

export interface UpdateStatusDto {
    status: TicketStatus;
}

class SupportService {
    async createTicket(data: CreateTicketDto): Promise<SupportTicket> {
        return authenticatedFetch('/support/tickets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getTickets(): Promise<SupportTicket[]> {
        return authenticatedFetch('/support/tickets', {
            method: 'GET'
        });
    }

    async getTicket(id: string): Promise<SupportTicket> {
        return authenticatedFetch(`/support/tickets/${id}`, {
            method: 'GET'
        });
    }

    async addMessage(ticketId: string, message: string): Promise<TicketMessage> {
        return authenticatedFetch(`/support/tickets/${ticketId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async updateStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
        return authenticatedFetch(`/support/tickets/${ticketId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
}

export const supportService = new SupportService();
