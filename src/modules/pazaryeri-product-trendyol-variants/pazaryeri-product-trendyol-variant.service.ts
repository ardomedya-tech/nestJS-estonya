import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PazaryeriProductTrendyol } from '../pazaryeri-product-trendyol/pazaryeri-product-trendyol.entity';
import { CreatePazaryeriProductVariantDto } from './dto/create-pazaryeri-product-variant.dto';
import { UpdatePazaryeriProductVariantDto } from './dto/update-pazaryeri-product-variant.dto';
import { PazaryeriProductTrendyolVariant } from './pazaryeri-product-trendyol-variant.entity';

@Injectable()
export class PazaryeriProductTrendyolVariantService {
  constructor(
    @InjectRepository(PazaryeriProductTrendyolVariant)
    private readonly pazaryeriProductVariantRepository: Repository<PazaryeriProductTrendyolVariant>,
    @InjectRepository(PazaryeriProductTrendyol)
    private readonly pazaryeriProductRepository: Repository<PazaryeriProductTrendyol>,
  ) {}

  findAll(userId: number) {
    return this.pazaryeriProductVariantRepository.find({
      where: { pazaryeriProduct: { userId } },
      relations: { pazaryeriProduct: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const entity = await this.pazaryeriProductVariantRepository.findOne({
      where: { id, pazaryeriProduct: { userId } },
      relations: { pazaryeriProduct: true },
    });

    if (!entity) {
      throw new NotFoundException(`PazaryeriProductTrendyolVariant with id ${id} not found`);
    }

    return entity;
  }

  async create(dto: CreatePazaryeriProductVariantDto, userId: number) {
    const pazaryeriProduct = await this.pazaryeriProductRepository.findOne({
      where: { id: dto.pazaryeriProductId, userId },
      select: { id: true },
    });

    if (!pazaryeriProduct) {
      throw new BadRequestException('Gecersiz pazaryeriProductId');
    }

    const entity = this.pazaryeriProductVariantRepository.create({
      ...dto,
      pazaryeriProductId: pazaryeriProduct.id,
    });

    return this.pazaryeriProductVariantRepository.save(entity);
  }

  async update(id: number, dto: UpdatePazaryeriProductVariantDto, userId: number) {
    const entity = await this.findOne(id, userId);

    if (
      dto.pazaryeriProductId !== undefined &&
      dto.pazaryeriProductId !== entity.pazaryeriProductId
    ) {
      const pazaryeriProduct = await this.pazaryeriProductRepository.findOne({
        where: { id: dto.pazaryeriProductId, userId },
        select: { id: true },
      });

      if (!pazaryeriProduct) {
        throw new BadRequestException('Gecersiz pazaryeriProductId');
      }
    }

    Object.assign(entity, dto);
    return this.pazaryeriProductVariantRepository.save(entity);
  }

  async remove(id: number, userId: number) {
    const entity = await this.findOne(id, userId);
    return this.pazaryeriProductVariantRepository.remove(entity);
  }
}
