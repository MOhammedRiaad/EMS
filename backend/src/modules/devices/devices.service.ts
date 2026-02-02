import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmsDevice } from './entities/ems-device.entity';
import { CreateDeviceDto, UpdateDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(EmsDevice)
    private readonly deviceRepository: Repository<EmsDevice>,
  ) {}

  async findAll(tenantId: string): Promise<EmsDevice[]> {
    return this.deviceRepository.find({
      where: { tenantId },
      relations: ['studio'],
      order: { label: 'ASC' },
    });
  }

  async findByStudio(studioId: string, tenantId: string): Promise<EmsDevice[]> {
    return this.deviceRepository.find({
      where: { studioId, tenantId },
      relations: ['studio'],
      order: { label: 'ASC' },
    });
  }

  async findAvailableByStudio(
    studioId: string,
    tenantId: string,
  ): Promise<EmsDevice[]> {
    return this.deviceRepository.find({
      where: { studioId, tenantId, status: 'available' },
      order: { label: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<EmsDevice> {
    const device = await this.deviceRepository.findOne({
      where: { id, tenantId },
      relations: ['studio'],
    });
    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }
    return device;
  }

  async create(dto: CreateDeviceDto, tenantId: string): Promise<EmsDevice> {
    const device = this.deviceRepository.create({
      ...dto,
      tenantId,
    });
    return this.deviceRepository.save(device);
  }

  async update(
    id: string,
    dto: UpdateDeviceDto,
    tenantId: string,
  ): Promise<EmsDevice> {
    const device = await this.findOne(id, tenantId);
    Object.assign(device, dto);
    return this.deviceRepository.save(device);
  }

  async updateStatus(
    id: string,
    status: EmsDevice['status'],
    tenantId: string,
  ): Promise<EmsDevice> {
    const device = await this.findOne(id, tenantId);
    device.status = status;
    return this.deviceRepository.save(device);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const device = await this.findOne(id, tenantId);
    await this.deviceRepository.remove(device);
  }
}
