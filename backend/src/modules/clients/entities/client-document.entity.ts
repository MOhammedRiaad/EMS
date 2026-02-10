import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities/base.entity';
import { Client } from './client.entity';
import { User } from '../../auth/entities/user.entity';

export enum DocumentCategory {
  CONTRACT = 'contract',
  WAIVER = 'waiver',
  MEDICAL = 'medical',
  CERTIFICATE = 'certificate',
  OTHER = 'other',
}

@Entity('client_documents')
export class ClientDocument extends BaseEntityWithUpdate {
  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_type', length: 50 })
  fileType: string; // 'application/pdf', 'image/jpeg', 'image/png'

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number; // in bytes

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string; // MinIO path

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;
}
