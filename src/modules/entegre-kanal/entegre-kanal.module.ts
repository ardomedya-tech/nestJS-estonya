import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../user/user.entity';
import { EntegreKanalController } from './entegre-kanal.controller';
import { EntegreKanal } from './entegre-kanal.entity';
import { EntegreKanalService } from './entegre-kanal.service';

@Module({
  imports: [TypeOrmModule.forFeature([EntegreKanal, User])],
  controllers: [EntegreKanalController],
  providers: [EntegreKanalService, AuthGuard],
  exports: [EntegreKanalService],
})
export class EntegreKanalModule {}
