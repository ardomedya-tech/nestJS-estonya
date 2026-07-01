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
import { PazaryeriProductVariant } from '../pazaryeri-product-variants/pazaryeri-product-variant.entity';
import { Product } from '../product/product.entity';

@Entity('PazaryeriProduct')
@Index(['productId', 'entegreKanalId'], { unique: true })
export class PazaryeriProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, (product) => product.pazaryeriProducts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

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

  @OneToMany(() => PazaryeriProductVariant, (variant) => variant.pazaryeriProduct, {
    cascade: true,
  })
  variants!: PazaryeriProductVariant[];

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;
}
