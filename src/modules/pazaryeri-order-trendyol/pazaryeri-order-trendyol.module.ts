import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyol } from '../pazaryeri-product-trendyol/pazaryeri-product-trendyol.entity';
import { Product } from '../product/product.entity';
import { UserEntegre } from '../user-entegre/user-entegre.entity';
import { User } from '../user/user.entity';
import { PazaryeriOrderTrendyolController } from './pazaryeri-order-trendyol.controller';
import { PazaryeriOrderTrendyol } from './pazaryeri-order-trendyol.entity';
import { PazaryeriOrderTrendyolService } from './pazaryeri-order-trendyol.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PazaryeriOrderTrendyol,
      PazaryeriProductTrendyol,
      Product,
      EntegreKanal,
      User,
      UserEntegre,
    ]),
  ],
  controllers: [PazaryeriOrderTrendyolController],
  providers: [PazaryeriOrderTrendyolService, AuthGuard],
  exports: [PazaryeriOrderTrendyolService],
})
export class PazaryeriOrderTrendyolModule {}
