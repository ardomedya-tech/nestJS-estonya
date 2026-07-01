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
import { CreatePazaryeriProductVariantDto } from './dto/create-pazaryeri-product-variant.dto';
import { UpdatePazaryeriProductVariantDto } from './dto/update-pazaryeri-product-variant.dto';
import { PazaryeriProductVariantService } from './pazaryeri-product-variant.service';

@UseGuards(AuthGuard)
@Controller('pazaryeri-product-variants')
export class PazaryeriProductVariantController {
  constructor(private readonly pazaryeriProductVariantService: PazaryeriProductVariantService) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.pazaryeriProductVariantService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.pazaryeriProductVariantService.findOne(id, request.user.id);
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
    dto: CreatePazaryeriProductVariantDto,
  ) {
    return this.pazaryeriProductVariantService.create(dto, request.user.id);
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
    dto: UpdatePazaryeriProductVariantDto,
  ) {
    return this.pazaryeriProductVariantService.update(id, dto, request.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.pazaryeriProductVariantService.remove(id, request.user.id);
  }
}
