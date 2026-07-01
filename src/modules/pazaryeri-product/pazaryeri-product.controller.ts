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
import { CreatePazaryeriProductDto } from './dto/create-pazaryeri-product.dto';
import { UpdatePazaryeriProductDto } from './dto/update-pazaryeri-product.dto';
import { PazaryeriProductService } from './pazaryeri-product.service';

@UseGuards(AuthGuard)
@Controller('pazaryeri-product')
export class PazaryeriProductController {
  constructor(private readonly pazaryeriProductService: PazaryeriProductService) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.pazaryeriProductService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.pazaryeriProductService.findOne(id, request.user.id);
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
    dto: CreatePazaryeriProductDto,
  ) {
    return this.pazaryeriProductService.create(dto, request.user.id);
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
    dto: UpdatePazaryeriProductDto,
  ) {
    return this.pazaryeriProductService.update(id, dto, request.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.pazaryeriProductService.remove(id, request.user.id);
  }
}
