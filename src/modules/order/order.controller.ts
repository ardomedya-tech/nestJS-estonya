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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { KargoDto } from './dto/kargo.dto';
import { StatusDto } from './dto/status.dto';
import { OrderService } from './order.service';

@UseGuards(AuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.orderService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.orderService.findOne(id, request.user.id);
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
    dto: CreateOrderDto,
  ) {
    return this.orderService.create(dto, request.user.id);
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
    dto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, dto, request.user.id);
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
    dto: KargoDto,
  ) {
    return this.orderService.setKargo(id, dto, request.user.id);
  }

  @Post(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: StatusDto,
  ) {
    return this.orderService.setStatus(id, dto, request.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.orderService.delete(id, request.user.id);
  }
}
