import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../../modules/user/user.entity';
import { SoruCevapService } from './soru-cevap.service';
import { OnaylaSoruDto } from './dto/onayla-soru.dto';
import { CronTaraDto } from './dto/cron-tara.dto';
import { SoruIsleDto } from './dto/soru-isle.dto';

@UseGuards(AuthGuard)
@Controller('soru-cevap')
export class SoruCevapController {
  constructor(private readonly soruCevapService: SoruCevapService) {}

  @Get('sorular')
  sorulariListele(
    @Req() request: Request & { user: User },
    @Query('durum') durum?: 'bekliyor' | 'gonderildi' | 'reddedildi',
  ) {
    return this.soruCevapService.sorulariListele(request.user.id, durum);
  }

  @Post('onayla')
  onayla(
    @Req() request: Request & { user: User },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: OnaylaSoruDto,
  ) {
    return this.soruCevapService.manuelOnayla(
      request.user.id,
      dto.soruId,
      dto.durum,
      dto.duzenlenmisCevap,
    );
  }

  @Post('soru-isle')
  soruIsle(
    @Req() request: Request & { user: User },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: SoruIsleDto,
  ): Promise<unknown> {
    return this.soruCevapService.soruIsle(
      request.user.id,
      dto.soruId,
      dto.autoSendThreshold ?? 0.75,
    );
  }

  @Post('cron-tara')
  cronTara(
    @Req() request: Request & { user: User },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CronTaraDto,
  ) {
    return this.soruCevapService.cronTaraVeIsle(
      request.user.id,
      dto.autoSendThreshold ?? 0.75,
    );
  }
}
