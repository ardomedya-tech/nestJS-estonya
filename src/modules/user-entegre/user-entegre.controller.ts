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
import { CreateUserEntegreDto } from './dto/create-user-entegre.dto';
import { UpdateUserEntegreDto } from './dto/update-user-entegre.dto';
import { UserEntegreService } from './user-entegre.service';

@UseGuards(AuthGuard)
@Controller('user-entegre')
export class UserEntegreController {
  constructor(private readonly userEntegreService: UserEntegreService) {}

  @Get()
  findAll(@Req() request: Request & { user: User }) {
    return this.userEntegreService.findAll(request.user.id);
  }

  @Get('findbyname/:slug')
  findByName(
    @Param('slug') slug: string,
    @Req() request: Request & { user: User },
  ) {
    return this.userEntegreService.findByName(request.user.id, slug);
  }

  @Get('secretbyname/:slug')
  findSecretByName(
    @Param('slug') slug: string,
    @Req() request: Request & { user: User },
  ) {
    return this.userEntegreService.findSecretByName(request.user.id, slug);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.userEntegreService.findOne(id, request.user.id);
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
    dto: CreateUserEntegreDto,
  ) {
    return this.userEntegreService.create(dto, request.user.id);
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
    dto: UpdateUserEntegreDto,
  ) {
    return this.userEntegreService.update(id, dto, request.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: User },
  ) {
    return this.userEntegreService.delete(id, request.user.id);
  }
}
