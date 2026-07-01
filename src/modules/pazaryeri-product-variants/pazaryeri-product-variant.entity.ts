import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PazaryeriProduct } from '../pazaryeri-product/pazaryeri-product.entity';

@Entity('PazaryeriProductVariant')
export class PazaryeriProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  pazaryeriProductId!: number;

  @ManyToOne(() => PazaryeriProduct, (pazaryeriProduct) => pazaryeriProduct.variants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pazaryeriProductId' })
  pazaryeriProduct!: PazaryeriProduct;

  @Column({ type: 'varchar', nullable: true })
  variantId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  barcode!: string | null;

  @Column({ type: 'text', nullable: true })
  productUrl!: string | null;

  @Column({ type: 'boolean', nullable: true })
  onSale!: boolean | null;

  @Column({ type: 'int', nullable: true })
  stock!: number | null;

  @Column({ type: 'float', nullable: true })
  salePrice!: number | null;

  @Column({ type: 'float', nullable: true })
  listPrice!: number | null;

  @Column({ type: 'float', nullable: true })
  vatRate!: number | null;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
