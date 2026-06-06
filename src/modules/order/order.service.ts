import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { Product } from '../product/product.entity';
import { KargoDto } from './dto/kargo.dto';
import { StatusDto } from './dto/status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  findAll(userId: number) {
    return this.orderRepository.find({
      where: { userId },
      relations: { user: true , entegreKanal: true},
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: { user: true, entegreKanal: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  async create(dto: CreateOrderDto, userId: number) {
    const tarih = dto.tarih ? new Date(dto.tarih) : new Date();
    if (Number.isNaN(tarih.getTime())) {
      throw new BadRequestException('tarih gecersiz tarih formatinda');
    }
    // perform product stock updates and order creation in a single transaction
    return await this.orderRepository.manager.transaction(async (manager) => {
      let orderId: string | undefined = undefined;

      if (dto.entegreKanalId) {
        const kanalRepo = manager.getRepository(EntegreKanal);
        const kanal = await kanalRepo.findOne({ where: { id: dto.entegreKanalId } });
        if (!kanal) throw new BadRequestException('Geçersiz entegreKanalId');
        const prefix = kanal.name.charAt(0).toUpperCase();

        const lastOrder = await manager.getRepository(Order)
          .createQueryBuilder('order')
          .where('order.entegreKanalId = :entegreKanalId', { entegreKanalId: dto.entegreKanalId })
          .orderBy('order.id', 'DESC')
          .getOne();

        let nextNumber = 1;
        if (lastOrder && lastOrder.orderId) {
          const match = lastOrder.orderId.match(/^[A-Z]-(\d{5})$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        orderId = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
      }

      // decrement stocks for each product in the DTO
      if (dto.products && Array.isArray(dto.products)) {
        const productRepo = manager.getRepository(Product);
        for (const p of dto.products) {
          const prod = await productRepo.findOne({ where: { id: p.id } });
          if (!prod) throw new BadRequestException(`Product id ${p.id} bulunamadi`);
          const quantity = typeof p.quantity === 'number' ? p.quantity : 1;
          if (prod.stock !== null && prod.stock !== undefined) {
            if (prod.stock < quantity) {
              throw new BadRequestException(`Product id ${p.id} icin yetersiz stok`);
            }
            prod.stock = prod.stock - quantity;
            await productRepo.save(prod);
          }
        }
      }

      const orderRepo = manager.getRepository(Order);
      const order = orderRepo.create({
        ...dto,
        entegreKanalId: dto.entegreKanalId ?? null,
        orderId,
        tarih,
        gelirGoster: dto.gelirGoster ?? false,
        internetSatisi: dto.internetSatisi ?? false,
        user: ({ id: userId } as Order['user']),
        userId,
      });

      return orderRepo.save(order);
    });
  }

  async update(id: number, dto: UpdateOrderDto, userId: number) {
    const existingOrder = await this.orderRepository.findOne({
      where: { id, userId },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const { tarih, ...rest } = dto;
    Object.assign(existingOrder, rest);

    if (tarih !== undefined) {
      const parsedTarih = new Date(tarih);
      if (Number.isNaN(parsedTarih.getTime())) {
        throw new BadRequestException('tarih gecersiz tarih formatinda');
      }
      existingOrder.tarih = parsedTarih;
    }

    return this.orderRepository.save(existingOrder);
  }

  async setKargo(id: number, dto: KargoDto, userId: number) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    order.kargoJSON = {
      ...(order.kargoJSON || {}),
      ...dto,
    } as Record<string, any>;

    return this.orderRepository.save(order);
  }

  async setStatus(id: number, dto: StatusDto, userId: number) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    if (dto.siparisStatus !== undefined) {
      order.siparisStatus = dto.siparisStatus;
    }

    if (dto.kargoStatus !== undefined) {
      order.kargoStatus = dto.kargoStatus;
    }

    if (dto.faturaStatus !== undefined) {
      order.faturaStatus = dto.faturaStatus;
    }

    return this.orderRepository.save(order);
  }

  async delete(id: number, userId: number) {
    const order = await this.findOne(id, userId);
    return this.orderRepository.remove(order);
  }
}
