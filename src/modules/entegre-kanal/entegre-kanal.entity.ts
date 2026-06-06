import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EntegreKanal')
export class EntegreKanal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  category!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
