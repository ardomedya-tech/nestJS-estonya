import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Soru } from './soru.entity';

@Entity('GonderilenCevap')
export class GonderilenCevap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  platform!: string; // 'trendyol' | 'hepsiburada'

  @Column({ type: 'text' })
  cevap!: string; // Gönderilen cevap

  @Column({ type: 'boolean', default: false })
  otomatikMi!: boolean; // true: otomatik gönderilen, false: manuel onaylanmış

  @Column({ type: 'jsonb', nullable: true })
  platformYaniti!: Record<string, unknown> | null; // Platform API yanıtı/hata logu

  @Column({ type: 'boolean', default: false })
  basariliMi!: boolean; // true: başarıyla gönderildi, false: hata

  @CreateDateColumn({ nullable: true })
  gonderilenZaman!: Date | null;

  @UpdateDateColumn({ nullable: true })
  guncelleme!: Date | null;

  // Soru ile bağlantı
  @ManyToOne(() => Soru, (soru) => soru.gonderilenCevaplar, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'soruId' })
  soru!: Soru;

  @Column({ type: 'int' })
  soruId!: number;
}
