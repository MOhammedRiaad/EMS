import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InBodyScan } from './entities/inbody-scan.entity';
import {
  CreateInBodyScanDto,
  UpdateInBodyScanDto,
  InBodyScanQueryDto,
} from './dto';

@Injectable()
export class InBodyScansService {
  constructor(
    @InjectRepository(InBodyScan)
    private readonly inBodyScanRepository: Repository<InBodyScan>,
  ) {}

  async create(
    dto: CreateInBodyScanDto,
    createdBy: string,
    tenantId: string,
    file?: { url: string; name: string },
  ): Promise<InBodyScan> {
    const scan = this.inBodyScanRepository.create({
      ...dto,
      ...(file ? { fileUrl: file.url, fileName: file.name } : {}),
      createdBy,
      tenantId,
    });

    return this.inBodyScanRepository.save(scan);
  }

  async findAll(
    query: InBodyScanQueryDto,
    tenantId: string,
  ): Promise<InBodyScan[]> {
    const where: any = { tenantId };

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.startDate && query.endDate) {
      where.scanDate = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    return this.inBodyScanRepository.find({
      where,
      relations: ['client', 'creator'],
      order: { scanDate: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<InBodyScan> {
    const scan = await this.inBodyScanRepository.findOne({
      where: { id, tenantId },
      relations: ['client', 'creator'],
    });

    if (!scan) {
      throw new NotFoundException(`InBody scan ${id} not found`);
    }

    return scan;
  }

  async findByClient(
    clientId: string,
    tenantId: string,
  ): Promise<InBodyScan[]> {
    return this.inBodyScanRepository.find({
      where: { clientId, tenantId },
      order: { scanDate: 'DESC' },
    });
  }

  async findLatest(
    clientId: string,
    tenantId: string,
  ): Promise<InBodyScan | null> {
    return this.inBodyScanRepository.findOne({
      where: { clientId, tenantId },
      order: { scanDate: 'DESC' },
    });
  }

  async calculateProgress(clientId: string, tenantId: string) {
    const scans = await this.findByClient(clientId, tenantId);

    if (scans.length < 2) {
      return { message: 'Need at least 2 scans to calculate progress' };
    }

    const latest = scans[0];
    const first = scans[scans.length - 1];

    return {
      first: {
        date: first.scanDate,
        weight: first.weight,
        bodyFatPercentage: first.bodyFatPercentage,
        skeletalMuscleMass: first.skeletalMuscleMass,
      },
      latest: {
        date: latest.scanDate,
        weight: latest.weight,
        bodyFatPercentage: latest.bodyFatPercentage,
        skeletalMuscleMass: latest.skeletalMuscleMass,
      },
      changes: {
        weight: parseFloat((latest.weight - first.weight).toFixed(2)),
        bodyFatPercentage: parseFloat(
          (latest.bodyFatPercentage - first.bodyFatPercentage).toFixed(2),
        ),
        skeletalMuscleMass: parseFloat(
          (latest.skeletalMuscleMass - first.skeletalMuscleMass).toFixed(2),
        ),
        weightPercent: parseFloat(
          (((latest.weight - first.weight) / first.weight) * 100).toFixed(2),
        ),
        bodyFatPercent: parseFloat(
          (
            ((latest.bodyFatPercentage - first.bodyFatPercentage) /
              first.bodyFatPercentage) *
            100
          ).toFixed(2),
        ),
        muscleMassPercent: parseFloat(
          (
            ((latest.skeletalMuscleMass - first.skeletalMuscleMass) /
              first.skeletalMuscleMass) *
            100
          ).toFixed(2),
        ),
      },
      totalScans: scans.length,
    };
  }

  async update(
    id: string,
    dto: UpdateInBodyScanDto,
    tenantId: string,
    file?: { url: string; name: string },
  ): Promise<InBodyScan> {
    const scan = await this.findOne(id, tenantId);

    Object.assign(scan, dto);
    if (file) {
      scan.fileUrl = file.url;
      scan.fileName = file.name;
    }

    return this.inBodyScanRepository.save(scan);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const scan = await this.findOne(id, tenantId);
    await this.inBodyScanRepository.remove(scan);
  }
}
