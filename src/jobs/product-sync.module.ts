import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsModule } from '../integrations/integrations.module';
import { EntegreKanal } from '../modules/entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductVariant } from '../modules/pazaryeri-product-variants/pazaryeri-product-variant.entity';
import { PazaryeriProduct } from '../modules/pazaryeri-product/pazaryeri-product.entity';
import { Product } from '../modules/product/product.entity';
import { UserEntegre } from '../modules/user-entegre/user-entegre.entity';
import { ProductSyncProcessor } from './processors/product-sync.processor';
import { ProductSyncQueue } from './queues/product-sync.queue';
import { ProductSyncCron } from './schedulers/product-sync.cron';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntegre, Product, PazaryeriProduct, PazaryeriProductVariant, EntegreKanal]), IntegrationsModule],
  providers: [ProductSyncProcessor, ProductSyncQueue, ProductSyncCron],
  exports: [ProductSyncProcessor, ProductSyncQueue, ProductSyncCron],
})
export class ProductSyncModule {}
