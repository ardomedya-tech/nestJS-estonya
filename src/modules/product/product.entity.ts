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

@Entity('Product')
export class Product {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'varchar' })
	name!: string;

	@Column({ type: 'varchar', nullable: true })
	altname!: string | null;

	@Column({ type: 'varchar', nullable: true })
	faturaName!: string | null;

	@Column({ type: 'varchar', nullable: true })
	category!: string | null;

	@Column({ type: 'varchar', nullable: true , unique: true })
	urunKodu!: string | null;

	@Column({ type: 'varchar', nullable: true })
	stokKodu!: string | null;

	@Column({ type: 'varchar', nullable: true })
	barkod!: string | null;

	@Column({ type: 'float', nullable: true })
	satisFiyati!: number | null;

	@Column({ type: 'float', nullable: true })
	listeFiyati!: number | null;

	@Column({ type: 'float', nullable: true })
	alisFiyati!: number | null;

	@Column({ type: 'float', nullable: true })
	kdv!: number | null;

	@Column({ type: 'float', nullable: true })
	hazirlikSuresi!: number | null;

	@Column({ type: 'int', nullable: true })
	stock!: number | null;

	@Column({ type: 'text', nullable: true })
	content!: string | null;

	@Column({ type: 'text', array: true, nullable: true })
	tags!: string[] | null;

	@Column({ type: 'boolean', nullable: true })
	salesOpen!: boolean | null;

	@Column({ type: 'jsonb', nullable: true })
	images!: string[] | null;

	@CreateDateColumn({ nullable: true })
	createdAt!: Date | null;

	@UpdateDateColumn({ nullable: true })
	updatedAt!: Date | null;

	@ManyToOne(() => User, (user) => user.products, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'userId' })
	user!: User | null;

	@Column({ type: 'int', nullable: true })
	userId!: number | null;
}
