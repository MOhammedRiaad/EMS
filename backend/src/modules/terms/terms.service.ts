import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsOfService } from './entities/terms.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';
import { CreateTermsDto } from './dto/terms.dto';

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(TermsOfService)
    private readonly termsRepo: Repository<TermsOfService>,
    @InjectRepository(TermsAcceptance)
    private readonly acceptanceRepo: Repository<TermsAcceptance>,
  ) {}

  async create(tenantId: string, dto: CreateTermsDto): Promise<TermsOfService> {
    if (dto.isActive) {
      // Deactivate others
      await this.termsRepo.update(
        { tenantId, isActive: true },
        { isActive: false },
      );
    }

    const terms = this.termsRepo.create({
      ...dto,
      tenantId,
    });
    return this.termsRepo.save(terms);
  }

  async getActive(tenantId: string): Promise<TermsOfService | null> {
    return this.termsRepo.findOne({
      where: { tenantId, isActive: true },
      order: { publishedAt: 'DESC' },
    });
  }

  async checkStatus(
    tenantId: string,
    clientId: string,
  ): Promise<{ accepted: boolean; termsId?: string }> {
    const activeTerms = await this.getActive(tenantId);
    if (!activeTerms) {
      return { accepted: true }; // No terms to accept
    }

    const acceptance = await this.acceptanceRepo.findOne({
      where: { tenantId, clientId, termsId: activeTerms.id },
    });

    return {
      accepted: !!acceptance,
      termsId: activeTerms.id,
    };
  }

  async accept(
    tenantId: string,
    clientId: string,
    termsId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TermsAcceptance> {
    const terms = await this.termsRepo.findOne({
      where: { id: termsId, tenantId },
    });
    if (!terms) throw new NotFoundException('Terms not found');

    const existing = await this.acceptanceRepo.findOne({
      where: { tenantId, clientId, termsId },
    });

    if (existing) return existing;

    const acceptance = this.acceptanceRepo.create({
      tenantId,
      clientId,
      termsId,
      ipAddress,
      userAgent,
    });

    return this.acceptanceRepo.save(acceptance);
  }
}
