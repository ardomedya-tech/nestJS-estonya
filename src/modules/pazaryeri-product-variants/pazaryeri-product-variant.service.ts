import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PazaryeriProduct } from '../pazaryeri-product/pazaryeri-product.entity';
import { CreatePazaryeriProductVariantDto } from './dto/create-pazaryeri-product-variant.dto';
import { UpdatePazaryeriProductVariantDto } from './dto/update-pazaryeri-product-variant.dto';
import { PazaryeriProductVariant } from './pazaryeri-product-variant.entity';

@Injectable()
export class PazaryeriProductVariantService {
  constructor(
    @InjectRepository(PazaryeriProductVariant)
    private readonly pazaryeriProductVariantRepository: Repository<PazaryeriProductVariant>,
    @InjectRepository(PazaryeriProduct)
    private readonly pazaryeriProductRepository: Repository<PazaryeriProduct>,
  ) {}

  findAll(userId: number) {
    return this.pazaryeriProductVariantRepository.find({
      where: { pazaryeriProduct: { product: { userId } } },
      relations: { pazaryeriProduct: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const entity = await this.pazaryeriProductVariantRepository.findOne({
      where: { id, pazaryeriProduct: { product: { userId } } },
      relations: { pazaryeriProduct: true },
    });

    if (!entity) {
      throw new NotFoundException(`PazaryeriProductVariant with id ${id} not found`);
    }

    return entity;
  }

  async create(dto: CreatePazaryeriProductVariantDto, userId: number) {
    const pazaryeriProduct = await this.pazaryeriProductRepository.findOne({
      where: { id: dto.pazaryeriProductId, product: { userId } },
      select: { id: true },
      relations: { product: true },
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
        where: { id: dto.pazaryeriProductId, product: { userId } },
        select: { id: true },
        relations: { product: true },
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
