import { Module } from '@nestjs/common';
import { OrderSyncModule } from './order-sync.module';
import { ProductSyncModule } from './product-sync.module';
import { SoruCevapSyncModule } from './soru-cevap-sync.module';

@Module({
  imports: [ProductSyncModule, SoruCevapSyncModule, OrderSyncModule],
  exports: [ProductSyncModule, SoruCevapSyncModule, OrderSyncModule],
})
export class JobsSyncModule {}
