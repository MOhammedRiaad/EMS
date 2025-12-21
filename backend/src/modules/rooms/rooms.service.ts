import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) { }

    async findByStudio(studioId: string, tenantId: string): Promise<Room[]> {
        return this.roomRepository.find({
            where: { studioId, tenantId, active: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Room> {
        const room = await this.roomRepository.findOne({
            where: { id, tenantId },
        });
        if (!room) {
            throw new NotFoundException(`Room ${id} not found`);
        }
        return room;
    }
}
