import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ImageDeleteDto } from './dto/image-delete.dto';
import { TableUpdateItemDto } from './dto/table-update-item.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
	private readonly productImagesBucket = 'product-images';

	constructor(
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,
	) {}

	private getSupabaseUrl() {
		const configuredUrl = process.env.SUPABASE_URL?.trim();
		if (configuredUrl) {
			return configuredUrl.replace(/\/$/, '');
		}
	}

	private getSupabaseAccessKey() {
		return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
	}

	private buildPublicImageUrl(supabaseUrl: string, objectPath: string) {
		return `${supabaseUrl}/storage/v1/object/public/${this.productImagesBucket}/${objectPath}`;
	}

	private sanitizeFileName(fileName: string) {
		return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
	}

	private async uploadImagesToSupabase(userId: number, files: any[]) {
		if (!files.length) {
			return null;
		}

		const supabaseUrl = this.getSupabaseUrl();
		const supabaseKey = this.getSupabaseAccessKey();

		if (!supabaseUrl || !supabaseKey) {
			throw new InternalServerErrorException(
				'Supabase storage configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
			);
		}

		return Promise.all(
			files.map(async (file) => {
				const objectPath = `${userId}/${Date.now()}-${randomUUID()}-${this.sanitizeFileName(file.originalname)}`;
				const uploadUrl = `${supabaseUrl}/storage/v1/object/${this.productImagesBucket}/${objectPath}`;

				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${supabaseKey}`,
						apikey: supabaseKey,
						'Content-Type': file.mimetype || 'application/octet-stream',
						'x-upsert': 'true',
					},
					body: file.buffer,
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new InternalServerErrorException(
						`Supabase image upload failed: ${errorText || response.statusText}`,
					);
				}

				return this.buildPublicImageUrl(supabaseUrl, objectPath);
			}),
		);
	}

	findAll(userId: number) {
		return this.productRepository.find({
			where: { userId },
			relations: { user: true, pazaryeriProducts: { entegreKanal: true, variants: true } },
			order: { id: 'DESC' },
		});
	}

	async findOnlyUrunKodu(userId: number) {
		const rows = await this.productRepository
			.createQueryBuilder('product')
			.select('product.urunKodu', 'urunKodu')
			.where('product.userId = :userId', { userId })
			.andWhere('product.urunKodu IS NOT NULL')
			.andWhere("product.urunKodu <> ''")
			.orderBy('product.id', 'DESC')
			.getRawMany<{ urunKodu: string }>();

		return rows.map((row) => row.urunKodu);
	}

	async findOne(id: number) {
		const product = await this.productRepository.findOne({
			where: { id },
			relations: { user: true, pazaryeriProducts: { entegreKanal: true, variants: true } },
		});

		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}

		return product;
	}

	async create(dto: CreateProductDto, userId: number, files: any[] = []) {
		const imageUrls = await this.uploadImagesToSupabase(userId, files);

		
		const product = this.productRepository.create({
			...dto,
			images: imageUrls,
			user: ({ id: userId } as Product['user']),
			userId,
		});

		return this.productRepository.save(product);
		
	}

	async tableUpdate(userId: number, tablePayload: TableUpdateItemDto[]) {
		if (!tablePayload.length) {
			return { updatedCount: 0, updatedIds: [] };
		}

		const updatedIds: number[] = [];

		await this.productRepository.manager.transaction(async (manager) => {
			for (const row of tablePayload) {
				const result = await manager.update(
					Product,
					{ id: row.id, userId },
					{
						satisFiyati: row.satisFiyati,
						listeFiyati: row.listeFiyati,
						stock: row.stock,
						salesOpen: row.salesOpen,
					},
				);

				if ((result.affected ?? 0) > 0) {
					updatedIds.push(row.id);
				}
			}
		});

		return {
			updatedCount: updatedIds.length,
			updatedIds,
		};
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

		await this.productRepository.manager.transaction(async (manager) => {
			for (const id of normalizedIds) {
				const result = await manager.delete(Product, { id, userId });

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

	async imageDelete(userId: number, dto: ImageDeleteDto) {
		const product = await this.productRepository.findOne({
			where: { id: dto.productId, userId },
		});

		if (!product) {
			throw new NotFoundException(`Product with id ${dto.productId} not found`);
		}

		const currentImages = product.images ?? [];
		const nextImages = currentImages.filter((image) => image !== dto.image);
		const deleted = nextImages.length !== currentImages.length;

		if (deleted) {
			product.images = nextImages.length ? nextImages : null;
			await this.productRepository.save(product);
		}

		return {
			deleted,
			productId: product.id,
			remainingImages: product.images ?? [],
		};
	}
	

	async update(
		id: number,
		dto: UpdateProductDto,
		userId: number,
		files: any[] = [],
	) {
		const product = await this.productRepository.findOne({
			where: { id, userId },
		});

		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
		
		const imageUrls = await this.uploadImagesToSupabase(userId, files);

		Object.assign(product, dto);
		if (imageUrls?.length) {
			product.images = product.images?.length
				? [...product.images, ...imageUrls]
				: imageUrls;
		}

		return this.productRepository.save(product);
	}

	async remove(id: number) {
		const product = await this.findOne(id);
		return this.productRepository.remove(product);
	}
}
