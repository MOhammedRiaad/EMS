import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waiver } from './entities/waiver.entity';
import { ClientWaiver } from './entities/client-waiver.entity';
import { SignWaiverDto } from './dto/sign-waiver.dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class WaiversService {
    constructor(
        @InjectRepository(Waiver)
        private waiverRepository: Repository<Waiver>,
        @InjectRepository(ClientWaiver)
        private clientWaiverRepository: Repository<ClientWaiver>,
        @Inject(forwardRef(() => ClientsService))
        private clientsService: ClientsService,
    ) { }

    async getLatestWaiver(tenantId: string): Promise<Waiver> {
        const waiver = await this.waiverRepository.findOne({
            where: { tenantId, isActive: true },
            order: { createdAt: 'DESC' },
        });

        if (!waiver) {
            // Create a default waiver if none exists (Bootstrap)
            const defaultWaiver = this.waiverRepository.create({
                tenantId,
                version: '1.0',
                isActive: true,
                content: `
                    <h2>Liability Waiver & Release</h2>
                    <p>By signing this document, I acknowledge the risks associated with EMS training...</p>
                    <p>I confirm I am in good health and have disclosed all medical conditions.</p>
                `
            });
            return this.waiverRepository.save(defaultWaiver);
        }

        return waiver;
    }

    async getClientSignatureStatus(tenantId: string, userId: string): Promise<{ signed: boolean; signedAt?: Date; waiverId?: string }> {
        const client = await this.clientsService.findByUserId(userId, tenantId);
        if (!client) {
            // If user is not a client (e.g. admin), they don't need to sign?
            // Or maybe we throw? For now, return true to not block admins.
            return { signed: true };
        }

        const latestWaiver = await this.getLatestWaiver(tenantId);

        const signature = await this.clientWaiverRepository.findOne({
            where: {
                tenantId,
                clientId: client.id,
                waiverId: latestWaiver.id
            }
        });

        return {
            signed: !!signature,
            signedAt: signature?.signedAt,
            waiverId: latestWaiver.id
        };
    }

    async signWaiver(tenantId: string, userId: string, dto: SignWaiverDto, ip: string, userAgent: string): Promise<ClientWaiver> {
        const client = await this.clientsService.findByUserId(userId, tenantId);
        if (!client) {
            throw new NotFoundException('Client profile not found');
        }

        const waiver = await this.waiverRepository.findOne({ where: { id: dto.waiverId, tenantId } });
        if (!waiver) {
            throw new NotFoundException('Waiver not found');
        }

        // Check if already signed
        const existing = await this.clientWaiverRepository.findOne({
            where: { tenantId, clientId: client.id, waiverId: waiver.id }
        });

        if (existing) {
            throw new BadRequestException('Waiver already signed');
        }

        const clientWaiver = this.clientWaiverRepository.create({
            tenantId,
            clientId: client.id,
            waiverId: waiver.id,
            signatureData: dto.signatureData,
            ipAddress: ip,
            userAgent: userAgent
        });

        return this.clientWaiverRepository.save(clientWaiver);
    }
    async getSignedWaiversForClient(tenantId: string, clientId: string): Promise<ClientWaiver[]> {
        return this.clientWaiverRepository.find({
            where: { tenantId, clientId },
            relations: ['waiver'],
            order: { signedAt: 'DESC' }
        });
    }
}
