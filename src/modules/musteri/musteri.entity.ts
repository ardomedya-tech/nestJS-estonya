import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('Musteri')
export class Musteri {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true  })
  adsoyad!: string | null;

  @Column({ type: 'varchar', nullable: true })
  adres!: string | null;

  @Column({ type: 'varchar', nullable: true })
  sehir!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ilce!: string | null;

  @Column({ type: 'varchar', nullable: true })
  postakodu!: string | null;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  tckimlik!: string | null;

  @Column({ type: 'varchar', nullable: true })
  vergino!: string | null;

  @Column({ type: 'varchar', nullable: true })
  vergidaire!: string | null;

  @Column({ type: 'varchar', nullable: true })
  firma!: string | null;

  @Column({ type: 'varchar', nullable: true })
  tipi!: string | null;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;
}
