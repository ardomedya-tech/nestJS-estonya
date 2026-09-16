import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PazaryeriProductTrendyol } from '../pazaryeri-product-trendyol/pazaryeri-product-trendyol.entity';
import { User } from '../user/user.entity';
import { PazaryeriProductTrendyolVariantController } from './pazaryeri-product-trendyol-variant.controller';
import { PazaryeriProductTrendyolVariant } from './pazaryeri-product-trendyol-variant.entity';
import { PazaryeriProductTrendyolVariantService } from './pazaryeri-product-trendyol-variant.service';

@Module({
  imports: [TypeOrmModule.forFeature([PazaryeriProductTrendyolVariant, PazaryeriProductTrendyol, User])],
  controllers: [PazaryeriProductTrendyolVariantController],
  providers: [PazaryeriProductTrendyolVariantService, AuthGuard],
  exports: [PazaryeriProductTrendyolVariantService],
})
export class PazaryeriProductTrendyolVariantModule {}
