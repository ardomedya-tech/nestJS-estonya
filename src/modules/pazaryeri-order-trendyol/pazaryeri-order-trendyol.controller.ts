import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../user/user.entity';
import { BulkDeletePazaryeriOrderTrendyolDto } from './dto/bulk-delete-pazaryeri-order-trendyol.dto';
import { SetTrendyolKargoDto } from './dto/set-trendyol-kargo.dto';
import { PazaryeriOrderTrendyolService } from './pazaryeri-order-trendyol.service';

@UseGuards(AuthGuard)
@Controller('pazaryeri-order-trendyol')
export class PazaryeriOrderTrendyolController {
  constructor(
    private readonly pazaryeriOrderTrendyolService: PazaryeriOrderTrendyolService,
  ) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.pazaryeriOrderTrendyolService.findAllByUser(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.pazaryeriOrderTrendyolService.findOneById(id, request.user.id);
  }
  

  @Post('bulk-delete')
  bulkDelete(
    @Req() request: Request & { user: User },
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: BulkDeletePazaryeriOrderTrendyolDto,
  ) {
    return this.pazaryeriOrderTrendyolService.bulkDeleteByIds(
      dto.ids,
      request.user.id,
    );
  }

  @Post(':id/kargo')
  setKargo(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: SetTrendyolKargoDto,
  ) {
    return this.pazaryeriOrderTrendyolService.setKargo(id, request.user.id, dto);
  }

  @Post(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
    @Body('status') status: string,
  ) {
    return this.pazaryeriOrderTrendyolService.setStatus(
      id,
      request.user.id,
      status,
    );
  }
}
