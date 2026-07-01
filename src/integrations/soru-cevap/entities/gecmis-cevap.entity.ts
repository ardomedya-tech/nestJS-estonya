import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntegre } from '../../../modules/user-entegre/user-entegre.entity';

@Entity('GecmisCevap')
export class GecmisCevap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  platform!: string; // 'trendyol' | 'hepsiburada'

  @Column({ type: 'text' })
  soru!: string; // Geçmiş soru

  @Column({ type: 'text' })
  cevap!: string; // Geçmiş cevap

  @Column({ type: 'varchar', nullable: true })
  kategori!: string | null; // 'kargo' | 'iade' | 'urun' | 'fatura' | 'genel'

  @Column({ type: 'int', default: 0 })
  kullanimSayisi!: number; // Kaç kez AI training örneği olarak kullanıldı

  @CreateDateColumn({ nullable: true })
  olusturulma!: Date | null;

  @UpdateDateColumn({ nullable: true })
  guncelleme!: Date | null;

  // UserEntegre ile bağlantı
  @ManyToOne(() => UserEntegre, (userEntegre) => userEntegre.gecmisCevaplar, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userEntegreId' })
  userEntegre!: UserEntegre;

  @Column({ type: 'int' })
  userEntegreId!: number;
}
