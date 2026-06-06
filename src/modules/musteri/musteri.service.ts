import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMusteriDto } from './dto/create-musteri.dto';
import { UpdateMusteriDto } from './dto/update-musteri.dto';
import { Musteri } from './musteri.entity';

@Injectable()
export class MusteriService {
  constructor(
    @InjectRepository(Musteri)
    private readonly musteriRepository: Repository<Musteri>,
  ) {}

  findAll(userId: number) {
    return this.musteriRepository.find({
      where: { userId },
      relations: { user: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const musteri = await this.musteriRepository.findOne({
      where: { id, userId },
      relations: { user: true },
    });

    if (!musteri) {
      throw new NotFoundException(`Musteri with id ${id} not found`);
    }

    return musteri;
  }

  async create(dto: CreateMusteriDto, userId: number) {
    const musteri = this.musteriRepository.create({
      ...dto,
      user: ({ id: userId } as Musteri['user']),
      userId,
    });

    return this.musteriRepository.save(musteri);
  }

  async update(id: number, dto: UpdateMusteriDto, userId: number) {
    const existingMusteri = await this.musteriRepository.findOne({
      where: { id, userId },
    });

    if (!existingMusteri) {
      throw new NotFoundException(`Musteri with id ${id} not found`);
    }

    Object.assign(existingMusteri, dto);
    return this.musteriRepository.save(existingMusteri);
  }

  async delete(id: number, userId: number) {
    const musteri = await this.findOne(id, userId);
    return this.musteriRepository.remove(musteri);
  }
}
