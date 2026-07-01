import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntegre } from '../../../modules/user-entegre/user-entegre.entity';
import { GonderilenCevap } from './gonderilen-cevap.entity';

@Entity('Soru')
export class Soru {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  platform!: string; // 'trendyol' | 'hepsiburada'

  @Column({ type: 'varchar', nullable: true, unique: true })
  platformSoruId!: string | null; // Platform'dan gelen soru ID'si

  @Column({ type: 'text' })
  soru!: string; // Müşterinin sorusu

  @Column({ type: 'varchar', nullable: true })
  urunAdi!: string | null; // İlgili ürün adı

  @Column({ type: 'varchar', nullable: true })
  musteriAdi!: string | null; // Müşteri adı

  @Column({ type: 'text', nullable: true })
  aiCevap!: string | null; // AI tarafından üretilen cevap

  @Column({ type: 'float', nullable: true })
  guvenSkor!: number | null; // AI güven skoru (0-1)

  @Column({ type: 'varchar', nullable: true })
  kategori!: string | null; // 'kargo' | 'iade' | 'urun' | 'fatura' | 'genel'

  @Column({
    type: 'varchar',
    default: 'bekliyor',
  })
  durum!: string; // 'bekliyor' | 'gonderildi' | 'reddedildi'

  @Column({ type: 'text', nullable: true })
  duzenlenmisCevap!: string | null; // Kullanıcı tarafından düzenlenen cevap

  @CreateDateColumn({ nullable: true })
  olusturulma!: Date | null;

  @UpdateDateColumn({ nullable: true })
  guncelleme!: Date | null;

  // UserEntegre ile bağlantı (user'ın marketplace integrationı)
  @ManyToOne(() => UserEntegre, (userEntegre) => userEntegre.sorular, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userEntegreId' })
  userEntegre!: UserEntegre;

  @Column({ type: 'int' })
  userEntegreId!: number;

  // Gönderilen cevaplarla ilişki
  @OneToMany(() => GonderilenCevap, (cevap) => cevap.soru, {
    cascade: true,
  })
  gonderilenCevaplar!: GonderilenCevap[];
}
