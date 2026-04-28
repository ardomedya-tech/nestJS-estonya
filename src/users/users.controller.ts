import { Body, Controller, Delete, Get, Param, Post, Put, Query ,ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    findAll(@Query("role") role?: string): any {
        return this.usersService.findAll(role);
    }

    @Get('profile')
    getProfile(): string {
        return 'This action returns the user profile';
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): any {
        return this.usersService.findOne(id);
    }

    @Post()
    create(@Body(ValidationPipe) user: CreateUserDto): any {
        return this.usersService.create(user);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) userUpdate: UpdateUserDto): any {
        return this.usersService.update(id, userUpdate);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number): any {
        return this.usersService.delete(id);
    }
}
