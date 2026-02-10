import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Transaction } from '../../packages/entities/transaction.entity';

@Injectable()
export class OwnerDataExportService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async exportTenantData(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const [clients, coaches, sessions, transactions] = await Promise.all([
      this.clientRepository.find({ where: { tenantId } }),
      this.coachRepository.find({ where: { tenantId } }),
      this.sessionRepository.find({ where: { tenantId } }),
      this.transactionRepository.find({ where: { tenantId } }),
    ]);

    return {
      tenant,
      generatedAt: new Date(),
      data: {
        clients,
        coaches,
        sessions,
        transactions,
      },
    };
  }
}
