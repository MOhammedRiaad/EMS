import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) { }

    async findAll(tenantId: string): Promise<Room[]> {
        return this.roomRepository.find({
            where: { tenantId, active: true },
            relations: ['studio'],
            order: { name: 'ASC' },
        });
    }

    async findByStudio(studioId: string, tenantId: string): Promise<Room[]> {
        return this.roomRepository.find({
            where: { studioId, tenantId, active: true },
            relations: ['studio'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Room> {
        const room = await this.roomRepository.findOne({
            where: { id, tenantId },
            relations: ['studio'],
        });
        if (!room) {
            throw new NotFoundException(`Room ${id} not found`);
        }
        return room;
    }

    async create(dto: CreateRoomDto, tenantId: string): Promise<Room> {
        const room = this.roomRepository.create({
            ...dto,
            tenantId,
            capacity: dto.capacity || 1,
        });
        return this.roomRepository.save(room);
    }

    async update(id: string, dto: UpdateRoomDto, tenantId: string): Promise<Room> {
        const room = await this.findOne(id, tenantId);
        Object.assign(room, dto);
        return this.roomRepository.save(room);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const room = await this.findOne(id, tenantId);
        room.active = false;
        await this.roomRepository.save(room);
    }
}
