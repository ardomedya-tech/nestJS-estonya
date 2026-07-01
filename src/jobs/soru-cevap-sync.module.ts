import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsModule } from '../integrations/integrations.module';
import { Soru } from '../integrations/soru-cevap/entities/soru.entity';
import { OtomatikCevapProcessor } from './processors/otomatik-cevap-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Soru]), IntegrationsModule],
  providers: [OtomatikCevapProcessor],
  exports: [OtomatikCevapProcessor],
})
export class SoruCevapSyncModule {}
