import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { User } from '../user/user.entity';

@Entity('Order')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  orderId!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  products!: Record<string, any>[];

  @ManyToOne(() => EntegreKanal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'entegreKanalId' })
  entegreKanal!: EntegreKanal | null;

  @Column({ type: 'int', nullable: true })
  entegreKanalId!: number | null;

  @Column({ type: 'varchar', nullable: true })
  siparisStatus!: string | null;

  @Column({ type: 'varchar', nullable: true })
  faturaStatus!: string | null;

  @Column({ type: 'varchar', nullable: true })
  kargoStatus!: string | null;

  @Column({ type: 'text', nullable: true })
  not!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  faturaAdresi!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  siparisAdresi!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  kargoJSON!: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  tarih!: Date;

  @Column({ type: 'boolean', default: false })
  gelirGoster!: boolean;

  @Column({ type: 'boolean', default: false })
  internetSatisi!: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;
}
