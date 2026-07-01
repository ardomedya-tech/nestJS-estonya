import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../product/product.entity';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

@Entity('User')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastname!: string | null;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' ,select: false })
  password!: string;

  @Column({ type: 'varchar'  })
  magazaName!: string;

  @Column({ type: 'varchar', nullable: true, unique: true , select: false })
  token!: string | null;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true})
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  identityNumber!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'enum', enum: Role, default: Role.USER , select: true })
  role!: Role;

  @Column({ type: 'varchar', nullable: true, unique: true })
  oAuthToken!: string | null;

  @Column({ type: 'jsonb', nullable: true, select: true })
  config!: Record<string, unknown> | null;

  @Column({ type: 'text', array: true, select: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  firmaBilgileri!: string[] | null;

  @OneToMany(() => Product, (product) => product.user)
  products!: Product[];
}