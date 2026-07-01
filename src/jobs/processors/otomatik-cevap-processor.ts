import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SoruCevapService } from '../../integrations/soru-cevap/soru-cevap.service';

@Injectable()
export class OtomatikCevapProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtomatikCevapProcessor.name);
  private cronInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly soruCevapService: SoruCevapService,
  ) {}

  /**
   * Module start'ında cron'u başlat
   */
  onModuleInit() {
    this.startCron();
  }

  /**
   * Module destroy'da cron'u durdur
   */
  onModuleDestroy() {
    this.stopCron();
  }

  /**
   * 10 dakikalık cron job'ı başlat (600000ms = 10 dakika)
   */
  private startCron() {
    this.logger.log('⏱️  Otomatik cevap cron job başlatılıyor (her 10 dakika)...');

    // Hemen ilk çalışmayı yap
    this.processOtomatikCevaplar().catch((err) => {
      this.logger.error(
        `❌ İlk çalışmada hata: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    // Sonra 10 dakika aralıkları ile çalıştır
    this.cronInterval = setInterval(() => {
      this.processOtomatikCevaplar().catch((err) => {
        this.logger.error(
          `❌ Cron çalışmasında hata: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }, 10 * 60 * 1000); // 10 dakika
  }

  /**
   * Cron job'ı durdur
   */
  private stopCron() {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.logger.log('⏸️  Otomatik cevap cron job durduruldu');
    }
  }

  /**
   * Her 10 dakikada bir bekleyen soruları tarar
   * - AI cevap üret
   * - Güven skoru >= 0.75 ise otomatik gönder
   * - Aksi halde manuel review için beklet
   */
  private async processOtomatikCevaplar() {
    this.logger.log('Otomatik cevap islemi basliyor');

    try {
      const result = await this.soruCevapService.cronTaraVeIsle(undefined, 0.75);
      
      this.logger.log(
        `Otomatik cevap tamamlandi. pulled=${result.fetch.pulled}, inserted=${result.fetch.inserted}, generated=${result.process.generated}, autoSent=${result.process.autoSent}`,
      );
    } catch (err) {
      this.logger.error(
        `Otomatik cevap processor hatasi: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
