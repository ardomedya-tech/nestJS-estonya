import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { MusteriModule } from './musteri/musteri.module';
import { OrderModule } from './order/order.module';
import { EntegreKanalModule } from './entegre-kanal/entegre-kanal.module';
import { PazaryeriOrderTrendyolModule } from './pazaryeri-order-trendyol/pazaryeri-order-trendyol.module';
import { PazaryeriProductTrendyolModule } from './pazaryeri-product-trendyol/pazaryeri-product-trendyol.module';
import { PazaryeriProductTrendyolVariantModule } from './pazaryeri-product-trendyol-variants/pazaryeri-product-trendyol-variant.module';
import { UserEntegreModule } from './user-entegre/user-entegre.module';

@Module({
  imports: [
    UserModule,
    ProductModule,
    MusteriModule,
    OrderModule,
    EntegreKanalModule,
    PazaryeriProductTrendyolModule,
    PazaryeriProductTrendyolVariantModule,
    PazaryeriOrderTrendyolModule,
    UserEntegreModule,
  ],
  exports: [
    UserModule,
    ProductModule,
    MusteriModule,
    OrderModule,
    EntegreKanalModule,
    PazaryeriProductTrendyolModule,
    PazaryeriProductTrendyolVariantModule,
    PazaryeriOrderTrendyolModule,
    UserEntegreModule,
  ],
})
export class FeatureModulesModule {}