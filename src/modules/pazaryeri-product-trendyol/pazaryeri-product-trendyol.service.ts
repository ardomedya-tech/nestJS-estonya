import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrendyolCredentials } from '../../integrations/trendyol/dto/trendyol-credentials.dto';
import {
  TrendyolInventoryPriceUpdateItem,
  TrendyolProductContentUpdateItem,
  TrendyolService,
} from '../../integrations/trendyol/trendyol.service';
import { decrypt } from '../../utils/encryption.util';
import { IsNull, Repository } from 'typeorm';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductTrendyolVariant } from '../pazaryeri-product-trendyol-variants/pazaryeri-product-trendyol-variant.entity';
import { UserEntegre } from '../user-entegre/user-entegre.entity';
import { CreatePazaryeriProductDto } from './dto/create-pazaryeri-product.dto';
import { UpdatePazaryeriProductDto } from './dto/update-pazaryeri-product.dto';
import { PazaryeriProductTrendyol } from './pazaryeri-product-trendyol.entity';

@Injectable()
export class PazaryeriProductTrendyolService {
  constructor(
    @InjectRepository(PazaryeriProductTrendyol)
    private readonly pazaryeriProductRepository: Repository<PazaryeriProductTrendyol>,
    @InjectRepository(PazaryeriProductTrendyolVariant)
    private readonly pazaryeriProductVariantRepository: Repository<PazaryeriProductTrendyolVariant>,
    @InjectRepository(UserEntegre)
    private readonly userEntegreRepository: Repository<UserEntegre>,
    @InjectRepository(EntegreKanal)
    private readonly entegreKanalRepository: Repository<EntegreKanal>,
    private readonly trendyolService: TrendyolService,
  ) {}

  private withProductDetail(entity: PazaryeriProductTrendyol) {
    return {
      ...entity,
      productDetail: null,
      variants: Array.isArray(entity.variants) ? entity.variants : [],
    };
  }

  private async findOneEntity(id: number, userId: number) {
    const entity = await this.pazaryeriProductRepository.findOne({
      where: { id, userId },
      relations: { entegreKanal: true, variants: true },
    });

    if (!entity) {
      throw new NotFoundException(`PazaryeriProductTrendyol with id ${id} not found`);
    }

    return entity;
  }

  findAll(userId: number) {
    return this.pazaryeriProductRepository
      .find({
        where: { userId },
        relations: { entegreKanal: true, variants: true },
        order: { id: 'DESC' },
      })
      .then((entities) => entities.map((entity) => this.withProductDetail(entity)));
  }

  async findOne(id: number, userId: number) {
    const entity = await this.findOneEntity(id, userId);
    return this.withProductDetail(entity);
  }

  async findByProductId(productId: number, userId: number) {
    const entities = await this.pazaryeriProductRepository.find({
      where: { productId, userId },
      relations: { entegreKanal: true, variants: true },
      order: { id: 'DESC' },
    });

    if (!entities.length) {
      throw new NotFoundException(`PazaryeriProductTrendyol for productId ${productId} not found`);
    }

    return entities.map((entity) => this.withProductDetail(entity));
  }

  async create(dto: CreatePazaryeriProductDto, userId: number) {
    const entegreKanal = dto.entegreKanalId
      ? await this.entegreKanalRepository.findOne({
          where: { id: dto.entegreKanalId },
          select: { id: true, name: true, slug: true },
        })
      : null;

    if (dto.entegreKanalId && !entegreKanal) {
      throw new BadRequestException('Gecersiz entegreKanalId');
    }

    const existing = await this.pazaryeriProductRepository.findOne({
      where: {
        userId,
        productId: dto.productId ?? IsNull(),
        entegreKanalId: dto.entegreKanalId ?? IsNull(),
      },
    });

    if (existing) {
      throw new BadRequestException('Bu product icin ayni pazaryeri kaydi zaten var');
    }

    const entity = this.pazaryeriProductRepository.create({
      ...dto,
      productId: dto.productId ?? null,
      userId,
      pazaryeriName: dto.pazaryeriName ?? entegreKanal?.name ?? '',
      entegreKanalId: entegreKanal?.id ?? null,
    });

    return this.pazaryeriProductRepository.save(entity);
  }

  async update(id: number, dto: UpdatePazaryeriProductDto, userId: number) {
    const entity = await this.findOneEntity(id, userId);
    const { variants, ...productDto } = dto;

    const nextProductId = dto.productId ?? entity.productId;
    const nextEntegreKanalId =
      dto.entegreKanalId === undefined ? entity.entegreKanalId : dto.entegreKanalId;

    if (
      (dto.productId !== undefined && dto.productId !== entity.productId) ||
      dto.entegreKanalId !== undefined
    ) {
      const existing = await this.pazaryeriProductRepository.findOne({
        where: {
          userId,
          productId: nextProductId ?? IsNull(),
          entegreKanalId: nextEntegreKanalId ?? IsNull(),
        },
      });

      if (existing && existing.id !== entity.id) {
        throw new BadRequestException('Bu product icin ayni pazaryeri kaydi zaten var');
      }
    }

    if (dto.entegreKanalId !== undefined) {
      if (dto.entegreKanalId === null) {
        entity.entegreKanalId = null;
        entity.entegreKanal = null;
      } else {
        const entegreKanal = await this.entegreKanalRepository.findOne({
          where: { id: dto.entegreKanalId },
          select: { id: true, name: true, slug: true, isActive: true, category: true },
        });

        if (!entegreKanal) {
          throw new BadRequestException('Gecersiz entegreKanalId');
        }

        entity.entegreKanalId = entegreKanal.id;
        entity.entegreKanal = entegreKanal;
        if (!dto.pazaryeriName) {
          entity.pazaryeriName = entegreKanal.name;
        }
      }
    }

    if (typeof productDto.pazaryeriName === 'string') {
      const trimmedName = productDto.pazaryeriName.trim();
      productDto.pazaryeriName = trimmedName || entity.pazaryeriName;
    }

    Object.assign(entity, productDto);

    if (variants !== undefined) {
      await this.syncTrendyolVariants(entity, variants, userId);
      const savedVariants = await this.updateVariants(entity, variants);
      entity.variants = savedVariants;

      const firstVariant = savedVariants[0];
      if (firstVariant?.salePrice !== null && firstVariant?.salePrice !== undefined) {
        entity.lastPrice = firstVariant.salePrice;
      }
      if (firstVariant?.stock !== null && firstVariant?.stock !== undefined) {
        entity.lastStock = firstVariant.stock;
      }
    }

    if (entity.userId === null || entity.userId === undefined) {
      entity.userId = userId;
    }
    return this.pazaryeriProductRepository.save(entity);
  }

  private async updateVariants(
    entity: PazaryeriProductTrendyol,
    variants: NonNullable<UpdatePazaryeriProductDto['variants']>,
  ) {
    if (!variants.length) {
      return entity.variants;
    }

    const variantMap = new Map(entity.variants.map((variant) => [variant.id, variant]));
    const barcodeMap = new Map(
      entity.variants
        .filter((variant) => Boolean(variant.barcode))
        .map((variant) => [variant.barcode as string, variant]),
    );

    const touched: PazaryeriProductTrendyolVariant[] = [];

    for (const item of variants) {
      const variant = this.resolveVariantEntity(variantMap, barcodeMap, item.id, item.barcode);

      if (item.barcode !== undefined) {
        variant.barcode = item.barcode;
      }
      if (item.listPrice !== undefined) {
        variant.listPrice = item.listPrice;
      }
      if (item.salePrice !== undefined) {
        variant.salePrice = item.salePrice;
      }
      if (item.stock !== undefined) {
        variant.stock = item.stock;
      }
      if (item.vatRate !== undefined) {
        variant.vatRate = item.vatRate;
      }
      if (item.title !== undefined) {
        variant.title = item.title;
      }
      if (item.onSale !== undefined) {
        variant.onSale = item.onSale;
      }

      touched.push(variant);
    }

    await this.pazaryeriProductVariantRepository.save(touched);

    return this.pazaryeriProductVariantRepository.find({
      where: { pazaryeriProductId: entity.id },
      order: { id: 'ASC' },
    });
  }

  private async syncTrendyolVariants(
    entity: PazaryeriProductTrendyol,
    variants: NonNullable<UpdatePazaryeriProductDto['variants']>,
    userId: number,
  ): Promise<void> {
    if (!variants.length) {
      return;
    }

    const slug = entity.entegreKanal?.slug?.toLocaleLowerCase('tr-TR');
    if (slug !== 'trendyol') {
      return;
    }

    if (!entity.entegreKanalId) {
      throw new BadRequestException('Trendyol entegreKanalId bulunamadi');
    }

    const userEntegre = await this.userEntegreRepository.findOne({
      where: {
        userId,
        entegreKanalId: entity.entegreKanalId,
      },
      relations: { entegreKanal: true },
    });

    if (!userEntegre?.apiData) {
      throw new BadRequestException('Trendyol entegrasyon bilgisi bulunamadi');
    }

    const credentials = this.parseCredentials(userEntegre.apiData);
    if (!credentials) {
      throw new BadRequestException('Trendyol API bilgileri gecersiz');
    }

    const variantMap = new Map(entity.variants.map((variant) => [variant.id, variant]));
    const barcodeMap = new Map(
      entity.variants
        .filter((variant) => Boolean(variant.barcode))
        .map((variant) => [variant.barcode as string, variant]),
    );

    const contentItems: TrendyolProductContentUpdateItem[] = [];

    const items: TrendyolInventoryPriceUpdateItem[] = variants.map((item) => {
      const variant = this.resolveVariantEntity(variantMap, barcodeMap, item.id, item.barcode);
      const barcode = item.barcode ?? variant.barcode;

      if (!barcode) {
        throw new BadRequestException('Variant barcode zorunludur');
      }

      const payload: TrendyolInventoryPriceUpdateItem = { barcode };

      const quantity = item.stock ?? variant.stock;
      const salePrice = item.salePrice ?? variant.salePrice;
      const listPrice = item.listPrice ?? variant.listPrice;

      if (quantity !== null && quantity !== undefined) {
        payload.quantity = quantity;
      }
      if (salePrice !== null && salePrice !== undefined) {
        payload.salePrice = salePrice;
      }
      if (listPrice !== null && listPrice !== undefined) {
        payload.listPrice = listPrice;
      }

      const resolvedContentId = Number(variant.variantId ?? entity.pazaryeriProductId);
      if (Number.isFinite(resolvedContentId) && resolvedContentId > 0) {
        const contentPayload: TrendyolProductContentUpdateItem = {
          contentId: resolvedContentId,
        };

        const title = item.title ?? variant.title ?? entity.pazaryeriName;
        const vatRate = item.vatRate ?? variant.vatRate;

        if (title) {
          contentPayload.title = title;
        }
        if (vatRate !== null && vatRate !== undefined) {
          contentPayload.vatRate = vatRate;
        }

        contentItems.push(contentPayload);
      }

      return payload;
    });

    if (contentItems.length) {
      const uniqueContentItems = Array.from(
        new Map(contentItems.map((contentItem) => [contentItem.contentId, contentItem])).values(),
      );
      await this.trendyolService.updateProductContentBulk(credentials, uniqueContentItems);
    }

    await this.trendyolService.updateProductPriceAndInventory(credentials, items);
  }

  private resolveVariantEntity(
    variantMap: Map<number, PazaryeriProductTrendyolVariant>,
    barcodeMap: Map<string, PazaryeriProductTrendyolVariant>,
    variantId?: number,
    barcode?: string,
  ): PazaryeriProductTrendyolVariant {
    const byId = variantId ? variantMap.get(variantId) : undefined;
    if (byId) {
      return byId;
    }

    const byBarcode = barcode ? barcodeMap.get(barcode) : undefined;
    if (byBarcode) {
      return byBarcode;
    }

    throw new BadRequestException('Variant bulunamadi');
  }

  private parseCredentials(encryptedApiData: string | null): TrendyolCredentials | null {
    if (!encryptedApiData) {
      return null;
    }

    try {
      const decrypted = decrypt(encryptedApiData);
      const parsed = JSON.parse(decrypted) as Partial<TrendyolCredentials>;

      if (!parsed.sellerId || !parsed.apiKey || !parsed.apiSecret) {
        return null;
      }

      return {
        sellerId: String(parsed.sellerId),
        apiKey: String(parsed.apiKey),
        apiSecret: String(parsed.apiSecret),
      };
    } catch {
      return null;
    }
  }

  async remove(id: number, userId: number) {
    const entity = await this.findOneEntity(id, userId);
    return this.pazaryeriProductRepository.remove(entity);
  }

  async tableDelete(userId: number, ids: string[]) {
    const normalizedIds = Array.from(
      new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (!normalizedIds.length) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const deletedIds: number[] = [];

    await this.pazaryeriProductRepository.manager.transaction(async (manager) => {
      for (const id of normalizedIds) {
        const result = await manager.delete(PazaryeriProductTrendyol, { id, userId });

        if ((result.affected ?? 0) > 0) {
          deletedIds.push(id);
        }
      }
    });

    return {
      deletedCount: deletedIds.length,
      deletedIds,
    };
  }
}
