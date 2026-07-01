import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TrendyolModule } from '../../integrations/trendyol/trendyol.module';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductVariant } from '../pazaryeri-product-variants/pazaryeri-product-variant.entity';
import { Product } from '../product/product.entity';
import { UserEntegre } from '../user-entegre/user-entegre.entity';
import { User } from '../user/user.entity';
import { PazaryeriProductController } from './pazaryeri-product.controller';
import { PazaryeriProduct } from './pazaryeri-product.entity';
import { PazaryeriProductService } from './pazaryeri-product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PazaryeriProduct,
      PazaryeriProductVariant,
      Product,
      User,
      UserEntegre,
      EntegreKanal,
    ]),
    TrendyolModule,
  ],
  controllers: [PazaryeriProductController],
  providers: [PazaryeriProductService, AuthGuard],
  exports: [PazaryeriProductService],
})
export class PazaryeriProductModule {}
