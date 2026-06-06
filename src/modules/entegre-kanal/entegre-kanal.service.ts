import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEntegreKanalDto } from './dto/create-entegre-kanal.dto';
import { UpdateEntegreKanalDto } from './dto/update-entegre-kanal.dto';
import { EntegreKanal } from './entegre-kanal.entity';

@Injectable()
export class EntegreKanalService {
  constructor(
    @InjectRepository(EntegreKanal)
    private readonly entegreKanalRepository: Repository<EntegreKanal>,
  ) {}

  findAll() {
    return this.entegreKanalRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const kanal = await this.entegreKanalRepository.findOne({ where: { id } });
    if (!kanal) throw new NotFoundException(`EntegreKanal with id ${id} not found`);
    return kanal;
  }

  async create(dto: CreateEntegreKanalDto) {
    const kanal = this.entegreKanalRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.entegreKanalRepository.save(kanal);
  }

  async update(id: number, dto: UpdateEntegreKanalDto) {
    const kanal = await this.findOne(id);
    Object.assign(kanal, dto);
    return this.entegreKanalRepository.save(kanal);
  }

  async delete(id: number) {
    const kanal = await this.findOne(id);
    return this.entegreKanalRepository.remove(kanal);
  }
}
