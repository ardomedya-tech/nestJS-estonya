import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyol } from '../pazaryeri-product-trendyol/pazaryeri-product-trendyol.entity';
import { UserEntegre } from '../user-entegre/user-entegre.entity';
import { User } from '../user/user.entity';
import { PazaryeriOrderTrendyol } from './pazaryeri-order-trendyol.entity';

const TRENDYOL_STATUS_MAP = {
  Created: 'yeni-siparis',
  Picking: 'yeni-siparis',
  Invoiced: 'yeni-siparis',
  Repack: 'yeni-siparis',
  Shipped: 'kargo',
  Delivered: 'teslim-edildi',
  UnDelivered: 'gonderilemedi',
  Returned: 'iade',
  Cancelled: 'iptal',
  UnSupplied: 'iptal',
} as const;

interface TrendyolOrderLineLike {
  merchantSku?: string;
  sku?: string;
  stockCode?: string;
  productName?: string;
  contentId?: string | number;
  discount?: number;
  vatRate?: number;
  barcode?: string;
  price?: number;
  commission?: number;
}

export type TrendyolOrderSyncAction = 'created' | 'updated' | 'skipped';

export interface TrendyolOrderUpsertResult {
  action: TrendyolOrderSyncAction;
  orderNumber: string | null;
  entity: PazaryeriOrderTrendyol | null;
  reason?: string;
}

type TrendyolOrderWithRelations = PazaryeriOrderTrendyol & {
  user: User | null;
  userEntegre: UserEntegre | null;
};

@Injectable()
export class PazaryeriOrderTrendyolService {
  constructor(
    @InjectRepository(PazaryeriOrderTrendyol)
    private readonly repository: Repository<PazaryeriOrderTrendyol>,
    @InjectRepository(PazaryeriProductTrendyol)
    private readonly pazaryeriProductRepository: Repository<PazaryeriProductTrendyol>,
    @InjectRepository(EntegreKanal)
    private readonly entegreKanalRepository: Repository<EntegreKanal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEntegre)
    private readonly userEntegreRepository: Repository<UserEntegre>,
  ) {}

  async findAllByUser(userId: number): Promise<TrendyolOrderWithRelations[]> {
    const orders = await this.repository.find({
      where: { userId },
      order: { id: 'DESC' },
    });

    return Promise.all(orders.map((order) => this.attachRelations(order)));
  }

  async findOneById(id: number, userId: number): Promise<TrendyolOrderWithRelations> {
    const order = await this.repository.findOne({
      where: { id, userId },
    });

    if (!order) {
      throw new NotFoundException(`Trendyol order with id ${id} not found`);
    }

    return this.attachRelations(order);
  }

  async bulkDeleteByIds(ids: number[], userId: number) {
    const normalizedIds = Array.from(
      new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
    );

    if (!normalizedIds.length) {
      throw new BadRequestException('Silinecek trendyol siparisi bulunamadi');
    }

    const orders = await this.repository.find({
      where: {
        id: In(normalizedIds),
        userId,
      },
    });

    if (!orders.length) {
      return {
        deletedCount: 0,
        requestedCount: normalizedIds.length,
      };
    }

    await this.repository.remove(orders);

    return {
      deletedCount: orders.length,
      requestedCount: normalizedIds.length,
    };
  }

  async setKargo(
    id: number,
    userId: number,
    payload: { kargoFirma?: string; aliciOder?: boolean },
  ) {
    const order = await this.findOneById(id, userId);

    if (payload.kargoFirma !== undefined) {
      order.kargoFirma = payload.kargoFirma || order.kargoFirma;
    }

    if (payload.aliciOder !== undefined) {
      order.aliciOder = payload.aliciOder;
    }

    return this.repository.save(order);
  }

  async setStatus(id: number, userId: number, status: string | null) {
    const order = await this.findOneById(id, userId);
    order.status = status;
    return this.repository.save(order);
  }

  async upsertFromTrendyolPayload(
    payload: Record<string, any>,
    userId: number,
    userEntegreId: number,
  ): Promise<TrendyolOrderUpsertResult> {
    const rawOrderNumber = payload.orderNumber ?? payload.id;
    const orderNumber = rawOrderNumber != null ? String(rawOrderNumber).trim() : '';

    if (!orderNumber) {
      return {
        action: 'skipped',
        orderNumber: null,
        entity: null,
        reason: 'missing-order-number',
      };
    }

    const normalized = await this.buildOrderEntityPayload(
      payload,
      orderNumber,
      userId,
      userEntegreId,
    );

    const existingForUser = await this.repository.findOne({
      where: { orderNumber, userId },
    });

    if (existingForUser) {
      Object.assign(existingForUser, normalized);
      const updated = await this.repository.save(existingForUser);

      return {
        action: 'updated',
        orderNumber,
        entity: updated,
      };
    }

    const existingByOrderNumber = await this.repository.findOne({
      where: { orderNumber },
    });

    if (existingByOrderNumber) {
      return {
        action: 'skipped',
        orderNumber,
        entity: null,
        reason: 'order-number-conflict-different-user',
      };
    }

    const created = this.repository.create(normalized);
    const saved = await this.repository.save(created);

    return {
      action: 'created',
      orderNumber,
      entity: saved,
    };
  }

  async createFromTrendyolPayload(
    payload: Record<string, any>,
    userId: number,
    userEntegreId: number,
  ): Promise<PazaryeriOrderTrendyol | null> {
    const result = await this.upsertFromTrendyolPayload(payload, userId, userEntegreId);
    return result.entity;
  }

  private async buildOrderEntityPayload(
    payload: Record<string, any>,
    orderNumber: string,
    userId: number,
    userEntegreId: number,
  ): Promise<Partial<PazaryeriOrderTrendyol>> {
    return {
      orderNumber,
      faturaAdresi: this.buildAddress(payload.invoiceAddress),
      kargoAdresi: this.buildAddress(payload.shipmentAddress),
      kargoId: this.extractCargoId(payload),
      kargoUrl: payload.cargoTrackingLink ?? null,
      kargoFirma: this.extractCargoFirma(payload),
      aliciOder: false,
      status: this.mapStatus(payload.status ?? payload.shipmentPackageStatus),
      totalPrice:
        typeof payload.totalPrice === 'number'
          ? payload.totalPrice
          : typeof payload.grossAmount === 'number'
            ? payload.grossAmount
            : null,
      faturaUrl: payload.invoiceLink ?? null,
      products: await this.buildProducts(payload.lines ?? [], userId),
      userId,
      userEntegreId,
    };
  }

  private async buildProducts(
    lines: TrendyolOrderLineLike[],
    userId: number,
  ): Promise<Record<string, any>[]> {
    const products: Record<string, any>[] = [];

    for (const line of lines) {
      const linkedProduct = await this.resolveLinkedPazaryeriProduct(line, userId);
      const normalizedLine = {
        sku: line.sku ?? line.barcode ?? null,
        barcode: line.barcode ?? null,
        stockCode: line.stockCode ?? line.merchantSku ?? line.sku ?? null,
        contentId: line.contentId ?? null,
        productName: line.productName ?? null,
        id: linkedProduct?.productId ?? null,
        price: line.price ?? null,
        vatRate: line.vatRate ?? null,
        discount: line.discount ?? 0,
        commision: line.commission ?? null,
      };

      products.push(normalizedLine);
    }

    return products;
  }

  private async resolveLinkedPazaryeriProduct(
    line: TrendyolOrderLineLike,
    userId: number,
  ): Promise<PazaryeriProductTrendyol | null> {
    const candidateValues = [
      line.sku ?? line.merchantSku ?? null,
      line.barcode ?? null,
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidateValues) {
      const match = await this.pazaryeriProductRepository.findOne({
        where: [
          { userId, pazaryeriSku: candidate },
          { userId, pazaryeriBarcode: candidate },
        ],
      });

      if (match) {
        return this.applyOrderLineToMarketplaceProduct(match, line);
      }
    }

    return null;
  }

  private async applyOrderLineToMarketplaceProduct(
    entity: PazaryeriProductTrendyol,
    line: TrendyolOrderLineLike,
  ): Promise<PazaryeriProductTrendyol> {
    const trendyolChannel = await this.findTrendyolEntegreKanal();
    entity.entegreKanalId = trendyolChannel?.id ?? entity.entegreKanalId;
    entity.entegreKanal = trendyolChannel ?? entity.entegreKanal;
    entity.pazaryeriName = this.toTextValue(line.productName) ?? entity.pazaryeriName ?? '';
    entity.pazaryeriProductId = this.toTextValue(line.contentId) ?? entity.pazaryeriProductId;
    entity.pazaryeriSku = this.toTextValue(line.sku) ?? this.toTextValue(line.merchantSku) ?? entity.pazaryeriSku;
    entity.pazaryeriBarcode = this.toTextValue(line.barcode) ?? entity.pazaryeriBarcode;
    entity.lastPrice = this.toNumberValue(line.price) ?? entity.lastPrice;
    entity.lastStock = 0;

    return this.pazaryeriProductRepository.save(entity);
  }

  private async findTrendyolEntegreKanal(): Promise<EntegreKanal | null> {
    return this.entegreKanalRepository.findOne({
      where: { slug: 'trendyol' },
      select: { id: true, slug: true, name: true },
    });
  }

  private toTextValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  }

  private toNumberValue(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    return null;
  }

  private buildAddress(address: Record<string, any> | null | undefined): Record<string, any> | null {
    if (!address || typeof address !== 'object') {
      return null;
    }

    return {
      firstName: address.firstName ?? address.first_name ?? null,
      lastName: address.lastName ?? address.last_name ?? null,
      company: address.company ?? null,
      address1: address.address1 ?? address.address ?? null,
      address2: address.address2 ?? null,
      city: address.city ?? null,
      disctrict: address.disctrict ?? address.district ?? address.county ?? null,
    };
  }

  private extractCargoId(payload: Record<string, any>): string | null {
    if (payload.shipmentNumber != null) {
      return String(payload.shipmentNumber);
    }

    if (payload.cargoTrackingNumber != null) {
      return String(payload.cargoTrackingNumber);
    }

    return null;
  }

  private extractCargoFirma(payload: Record<string, any>): string | null {
    const candidateValues = [
      payload.cargoProviderName,
      payload.cargoCompanyName,
      payload.cargoCompany,
      payload.shipmentProviderName,
      payload.cargoProvider?.name,
      payload.cargoProvider?.displayName,
      payload.shipmentProvider?.name,
      payload.shipmentProvider?.displayName,
    ];

    for (const candidate of candidateValues) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private async attachRelations(
    order: PazaryeriOrderTrendyol,
  ): Promise<TrendyolOrderWithRelations> {
    const [user, userEntegre] = await Promise.all([
      order.userId
        ? this.userRepository.findOne({ where: { id: order.userId } })
        : Promise.resolve(null),
      order.userEntegreId
        ? this.userEntegreRepository.findOne({
            where: { id: order.userEntegreId, userId: order.userId ?? undefined },
            relations: { entegreKanal: true, user: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      ...order,
      user,
      userEntegre,
    };
  }

  private mapStatus(status: string | undefined): string | null {
    if (!status) {
      return 'yeni-siparis';
    }

    return TRENDYOL_STATUS_MAP[status as keyof typeof TRENDYOL_STATUS_MAP] ?? 'yeni-siparis';
  }
}
