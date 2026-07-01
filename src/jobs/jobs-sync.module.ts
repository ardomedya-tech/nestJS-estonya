import { Module } from '@nestjs/common';
import { ProductSyncModule } from './product-sync.module';
import { SoruCevapSyncModule } from './soru-cevap-sync.module';

@Module({
  imports: [ProductSyncModule, SoruCevapSyncModule],
  exports: [ProductSyncModule, SoruCevapSyncModule],
})
export class JobsSyncModule {}
