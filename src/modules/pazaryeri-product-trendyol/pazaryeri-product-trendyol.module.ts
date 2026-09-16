import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TrendyolModule } from '../../integrations/trendyol/trendyol.module';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyolVariant } from '../pazaryeri-product-trendyol-variants/pazaryeri-product-trendyol-variant.entity';
import { UserEntegre } from '../user-entegre/user-entegre.entity';
import { User } from '../user/user.entity';
import { PazaryeriProductTrendyolController } from './pazaryeri-product-trendyol.controller';
import { PazaryeriProductTrendyol } from './pazaryeri-product-trendyol.entity';
import { PazaryeriProductTrendyolService } from './pazaryeri-product-trendyol.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PazaryeriProductTrendyol,
      PazaryeriProductTrendyolVariant,
      User,
      UserEntegre,
      EntegreKanal,
    ]),
    TrendyolModule,
  ],
  controllers: [PazaryeriProductTrendyolController],
  providers: [PazaryeriProductTrendyolService, AuthGuard],
  exports: [PazaryeriProductTrendyolService],
})
export class PazaryeriProductTrendyolModule {}
