import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyolVariant } from '../pazaryeri-product-trendyol-variants/pazaryeri-product-trendyol-variant.entity';

@Entity('PazaryeriProductTrendyol')
@Index(['productId', 'entegreKanalId'], { unique: true })
export class PazaryeriProductTrendyol {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  productId!: number | null;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @Column({ type: 'int', nullable: true })
  entegreKanalId!: number | null;

  @ManyToOne(() => EntegreKanal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'entegreKanalId' })
  entegreKanal!: EntegreKanal | null;

  @Column({ type: 'varchar' })
  pazaryeriName!: string;

  @Column({ type: 'varchar', nullable: true })
  pazaryeriProductId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  pazaryeriSku!: string | null;

  @Column({ type: 'varchar', nullable: true })
  pazaryeriBarcode!: string | null;

  @Column({ type: 'float', nullable: true })
  lastPrice!: number | null;

  @Column({ type: 'int', nullable: true })
  lastStock!: number | null;

  @OneToMany(() => PazaryeriProductTrendyolVariant, (variant) => variant.pazaryeriProduct, {
    cascade: true,
  })
  variants!: PazaryeriProductTrendyolVariant[];

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
