import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Soru } from './entities/soru.entity';
import { GonderilenCevap } from './entities/gonderilen-cevap.entity';
import { GecmisCevap } from './entities/gecmis-cevap.entity';
import { SoruCevapService } from './soru-cevap.service';
import { UserEntegre } from '../../modules/user-entegre/user-entegre.entity';
import { TrendyolModule } from '../trendyol/trendyol.module';
import { HepsiburadaModule } from '../hepsiburada/hepsiburada.module';
import { SoruCevapController } from './soru-cevap.controller';
import { User } from '../../modules/user/user.entity';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Soru,
      GonderilenCevap,
      GecmisCevap,
      UserEntegre,
      User,
    ]),
    TrendyolModule,
    HepsiburadaModule,
  ],
  controllers: [SoruCevapController],
  providers: [SoruCevapService, AuthGuard],
  exports: [SoruCevapService],
})
export class SoruCevapModule {}
