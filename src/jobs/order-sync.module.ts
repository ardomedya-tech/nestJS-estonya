import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PazaryeriOrderTrendyolModule } from '../modules/pazaryeri-order-trendyol/pazaryeri-order-trendyol.module';
import { UserEntegre } from '../modules/user-entegre/user-entegre.entity';
import { OrderSyncProcessor } from './processors/order-sync.processor';
import { OrderSyncQueue } from './queues/order-sync.queue';
import { OrderSyncCron } from './schedulers/order-sync.cron';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntegre]), IntegrationsModule, PazaryeriOrderTrendyolModule],
  providers: [OrderSyncProcessor, OrderSyncQueue, OrderSyncCron],
  exports: [OrderSyncProcessor, OrderSyncQueue, OrderSyncCron],
})
export class OrderSyncModule {}
