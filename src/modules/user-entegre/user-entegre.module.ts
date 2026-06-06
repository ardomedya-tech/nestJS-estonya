import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { User } from '../user/user.entity';
import { UserEntegreController } from './user-entegre.controller';
import { UserEntegre } from './user-entegre.entity';
import { UserEntegreService } from './user-entegre.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntegre, EntegreKanal, User])],
  controllers: [UserEntegreController],
  providers: [UserEntegreService, AuthGuard],
  exports: [UserEntegreService],
})
export class UserEntegreModule {}
