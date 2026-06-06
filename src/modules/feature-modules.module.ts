import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { MusteriModule } from './musteri/musteri.module';
import { OrderModule } from './order/order.module';
import { EntegreKanalModule } from './entegre-kanal/entegre-kanal.module';
import { UserEntegreModule } from './user-entegre/user-entegre.module';

@Module({
  imports: [UserModule, ProductModule, MusteriModule, OrderModule, EntegreKanalModule, UserEntegreModule],
  exports: [UserModule, ProductModule, MusteriModule, OrderModule, EntegreKanalModule, UserEntegreModule],
})
export class FeatureModulesModule {}