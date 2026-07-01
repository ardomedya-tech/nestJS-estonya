import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PazaryeriProduct } from '../pazaryeri-product/pazaryeri-product.entity';
import { User } from '../user/user.entity';
import { PazaryeriProductVariantController } from './pazaryeri-product-variant.controller';
import { PazaryeriProductVariant } from './pazaryeri-product-variant.entity';
import { PazaryeriProductVariantService } from './pazaryeri-product-variant.service';

@Module({
  imports: [TypeOrmModule.forFeature([PazaryeriProductVariant, PazaryeriProduct, User])],
  controllers: [PazaryeriProductVariantController],
  providers: [PazaryeriProductVariantService, AuthGuard],
  exports: [PazaryeriProductVariantService],
})
export class PazaryeriProductVariantModule {}
