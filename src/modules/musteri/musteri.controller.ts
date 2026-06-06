import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../user/user.entity';
import { CreateMusteriDto } from './dto/create-musteri.dto';
import { UpdateMusteriDto } from './dto/update-musteri.dto';
import { MusteriService } from './musteri.service';

@UseGuards(AuthGuard)
@Controller('musteri')
export class MusteriController {
  constructor(private readonly musteriService: MusteriService) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.musteriService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.musteriService.findOne(id, request.user.id);
  }

  @Post()
  create(
    @Req() request: Request & { user: User },
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: CreateMusteriDto,
  ) {
    return this.musteriService.create(dto, request.user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: UpdateMusteriDto,
  ) {
    return this.musteriService.update(id, dto, request.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.musteriService.delete(id, request.user.id);
  }
}
