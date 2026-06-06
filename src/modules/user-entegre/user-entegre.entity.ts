import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { User } from '../user/user.entity';

@Entity('UserEntegre')
export class UserEntegre {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  entegreKanalId!: number;

  @ManyToOne(() => EntegreKanal, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entegreKanalId' })
  entegreKanal!: EntegreKanal;

  @Column({ type: 'boolean', default: false })
  status!: boolean;

  @Column({ type: 'boolean', default: false })
  urunSync!: boolean;

  @Column({ type: 'boolean', default: false })
  stockSync!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  subscribed_at!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  apiData!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  apiSettings!: Record<string, unknown> | null;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
