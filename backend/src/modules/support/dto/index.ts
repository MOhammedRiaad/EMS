import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { TicketPriority, TicketCategory, TicketStatus } from '../entities/support-ticket.entity';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsEnum(TicketPriority)
    priority: TicketPriority;

    @IsEnum(TicketCategory)
    category: TicketCategory;
}

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;
}

export class UpdateTicketStatusDto {
    @IsEnum(TicketStatus)
    status: TicketStatus;
}
