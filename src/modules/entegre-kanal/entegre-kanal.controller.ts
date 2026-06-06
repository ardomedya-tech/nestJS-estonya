import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateEntegreKanalDto } from './dto/create-entegre-kanal.dto';
import { UpdateEntegreKanalDto } from './dto/update-entegre-kanal.dto';
import { EntegreKanalService } from './entegre-kanal.service';

@UseGuards(AuthGuard)
@Controller('entegre-kanal')
export class EntegreKanalController {
  constructor(private readonly entegreKanalService: EntegreKanalService) {}

  @Get()
  findAll() {
    return this.entegreKanalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entegreKanalService.findOne(id);
  }

  @Post()
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: CreateEntegreKanalDto,
  ) {
    return this.entegreKanalService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: UpdateEntegreKanalDto,
  ) {
    return this.entegreKanalService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entegreKanalService.delete(id);
  }
}
