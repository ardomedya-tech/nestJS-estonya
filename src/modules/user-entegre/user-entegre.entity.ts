import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { User } from '../user/user.entity';
import { Soru } from '../../integrations/soru-cevap/entities/soru.entity';
import { GecmisCevap } from '../../integrations/soru-cevap/entities/gecmis-cevap.entity';

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

  @Column({ type: 'boolean', default: false })
  soruCevapSync!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  subscribed_at!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  apiData!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  apiSettings!: Record<string, unknown> | null;

  // Soru-Cevap ilişkileri
  @OneToMany(() => Soru, (soru) => soru.userEntegre, {
    cascade: true,
  })
  sorular!: Soru[];

  @OneToMany(() => GecmisCevap, (gecmisCevap) => gecmisCevap.userEntegre, {
    cascade: true,
  })
  gecmisCevaplar!: GecmisCevap[];

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
