import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { User } from '../../auth/entities/user.entity';
import { Studio } from '../../studios/entities/studio.entity';

@Entity('coaches')
export class Coach extends TenantScopedEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'studio_id', type: 'uuid' })
    studioId: string;

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @Column({ type: 'text', array: true, default: [] })
    specializations: string[];

    @Column({
        name: 'preferred_client_gender',
        type: 'enum',
        enum: ['male', 'female', 'any'],
        default: 'any'
    })
    preferredClientGender: 'male' | 'female' | 'any';

    @Column({ name: 'availability_rules', type: 'jsonb', default: [] })
    availabilityRules: any[];

    @Column({ default: true })
    active: boolean;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Studio, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;
}
