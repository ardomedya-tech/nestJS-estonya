import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsModule } from '../integrations/integrations.module';
import { EntegreKanal } from '../modules/entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyolVariant } from '../modules/pazaryeri-product-trendyol-variants/pazaryeri-product-trendyol-variant.entity';
import { PazaryeriProductTrendyol } from '../modules/pazaryeri-product-trendyol/pazaryeri-product-trendyol.entity';
import { UserEntegre } from '../modules/user-entegre/user-entegre.entity';
import { ProductSyncProcessor } from './processors/product-sync.processor';
import { ProductSyncQueue } from './queues/product-sync.queue';
import { ProductSyncCron } from './schedulers/product-sync.cron';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntegre, PazaryeriProductTrendyol, PazaryeriProductTrendyolVariant, EntegreKanal]), IntegrationsModule],
  providers: [ProductSyncProcessor, ProductSyncQueue, ProductSyncCron],
  exports: [ProductSyncProcessor, ProductSyncQueue, ProductSyncCron],
})
export class ProductSyncModule {}
