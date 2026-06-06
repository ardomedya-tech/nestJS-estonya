import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
    constructor(
    @InjectRepository(User)
        private readonly userRepository: Repository<User>,
  ) {}

    findAll(role?: string) {
        return this.userRepository.find({
            where: role ? { role: role as User['role'] } : {},
            relations: { products: true },
            order: { id: 'DESC' },
        });
    }

    async findOne(id: number) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: { products: true },
        });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        return user;
    }

    async create(data: CreateUserDto) {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }

    async update(id: number, user: UpdateUserDto) {
        const existingUser = await this.userRepository.preload({ id, ...user });

        if (!existingUser) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        return this.userRepository.save(existingUser);
    }

    async delete(id: number) {
        const user = await this.findOne(id);
        return this.userRepository.remove(user);
    }
}
