import { Module } from '@nestjs/common';
import { TrendyolModule } from './trendyol/trendyol.module';
import { HepsiburadaModule } from './hepsiburada/hepsiburada.module';
import { SoruCevapModule } from './soru-cevap/soru-cevap.module';

@Module({
  imports: [TrendyolModule, HepsiburadaModule, SoruCevapModule],
  exports: [TrendyolModule, HepsiburadaModule, SoruCevapModule],
})
export class IntegrationsModule {}
