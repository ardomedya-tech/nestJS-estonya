import { Module } from '@nestjs/common';
import { HepsiburadaService } from './hepsiburada.service';

@Module({
  providers: [HepsiburadaService],
  exports: [HepsiburadaService],
})
export class HepsiburadaModule {}
