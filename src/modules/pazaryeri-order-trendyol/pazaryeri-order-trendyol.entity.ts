import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('PazaryeriOrderTrendyol')
export class PazaryeriOrderTrendyol {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  orderNumber!: string;

  @Column({ type: 'jsonb', nullable: true })
  faturaAdresi!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  kargoAdresi!: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  kargoId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  kargoUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  kargoFirma!: string | null;

  @Column({ type: 'boolean', nullable: true, default: false })
  aliciOder!: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  status!: string | null;

  @Column({ type: 'float', nullable: true })
  totalPrice!: number | null;

  @Column({ type: 'varchar', nullable: true })
  faturaUrl!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  products!: Record<string, any>[];

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @Column({ type: 'int', nullable: true })
  userEntegreId!: number | null;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
