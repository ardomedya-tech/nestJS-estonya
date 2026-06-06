import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../user/user.entity';
import { MusteriController } from './musteri.controller';
import { Musteri } from './musteri.entity';
import { MusteriService } from './musteri.service';

@Module({
  imports: [TypeOrmModule.forFeature([Musteri, User])],
  controllers: [MusteriController],
  providers: [MusteriService, AuthGuard],
  exports: [MusteriService],
})
export class MusteriModule {}
