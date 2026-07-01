import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrendyolService } from '../../integrations/trendyol/trendyol.service';
import { TrendyolCredentials } from '../../integrations/trendyol/dto/trendyol-credentials.dto';
import { EntegreKanal } from '../../modules/entegre-kanal/entegre-kanal.entity';
import { PazaryeriProductVariant } from '../../modules/pazaryeri-product-variants/pazaryeri-product-variant.entity';
import { PazaryeriProduct } from '../../modules/pazaryeri-product/pazaryeri-product.entity';
import { Product } from '../../modules/product/product.entity';
import { UserEntegre } from '../../modules/user-entegre/user-entegre.entity';
import { decrypt } from '../../utils/encryption.util';
import { Repository } from 'typeorm';

export interface ProductSyncJob {
	userId: number;
	userEntegreId: number;
}

interface TrendyolIncomingProduct {
	contentId?: string | number;
	productMainId?: string | number;
	title?: string;
	description?: string;
	images?: unknown;
	variants?: TrendyolIncomingVariant[];
}

interface TrendyolIncomingVariant {
	variantId?: string | number;
	barcode?: string;
	stockCode?: string;
	title?: string;
	stock?: number;
	salePrice?: number;
	listPrice?: number;
	vatRate?: number;
	productUrl?: string;
	onSale?: boolean;
	archived?: boolean;
	blacklisted?: boolean;
	hasViolation?: boolean;
}

interface PazaryeriProductVariantPayload {
	variantId: string | null;
	barcode: string | null;
	productUrl: string | null;
	onSale: boolean | null;
	stock: number | null;
	salePrice: number | null;
	listPrice: number | null;
	vatRate: number | null;
	title: string | null;
}

interface PazaryeriProductPayload {
	entegreKanalId: number | null;
	pazaryeriName: string;
	pazaryeriProductId: string | null;
	pazaryeriSku: string | null;
	pazaryeriBarcode: string | null;
	lastPrice: number | null;
	lastStock: number | null;
	variants: PazaryeriProductVariantPayload[];
}

interface MappedMarketplaceProduct {
	product: Partial<Product> & { name: string };
	pazaryeriProduct: PazaryeriProductPayload;
}

@Injectable()
export class ProductSyncProcessor {
	private readonly logger = new Logger(ProductSyncProcessor.name);

	constructor(
		@InjectRepository(UserEntegre)
		private readonly userEntegreRepository: Repository<UserEntegre>,
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,
		@InjectRepository(PazaryeriProduct)
		private readonly pazaryeriProductRepository: Repository<PazaryeriProduct>,
		@InjectRepository(PazaryeriProductVariant)
		private readonly pazaryeriProductVariantRepository: Repository<PazaryeriProductVariant>,
		@InjectRepository(EntegreKanal)
		private readonly entegreKanalRepository: Repository<EntegreKanal>,
		private readonly trendyolService: TrendyolService,
	) {}

	async process(job: ProductSyncJob): Promise<boolean> {
		const userEntegre = await this.userEntegreRepository.findOne({
			where: { id: job.userEntegreId, userId: job.userId },
			relations: { entegreKanal: true },
		});
		if (!userEntegre) {
			this.logger.warn(`UserEntegre not found for job: ${JSON.stringify(job)}`);
			return false;
		}

		if (!userEntegre.status) {
			this.logger.debug(`Skipping product sync. status=false for user ${job.userId}`);
			return false;
		}

        if (!userEntegre.urunSync) {
			this.logger.debug(`Skipping product sync. urunSync=false for user ${job.userId}`);
			return false;
		}

		if (userEntegre.entegreKanal?.slug !== 'trendyol') {
			this.logger.debug(
				`Skipping product sync. entegreKanal is not trendyol for user ${job.userId}`,
			);
			return false;
		}

		const credentials = this.parseCredentials(userEntegre.apiData);
		const entegreKanal = await this.resolveEntegreKanalBySlug(
			userEntegre.entegreKanal?.slug,
		);

		if (!entegreKanal) {
			this.logger.warn(
				`Skipping product sync. EntegreKanal slug not found for user ${job.userId}`,
			);
			return false;
		}
		
		if (!credentials) {
			this.logger.warn(
				`Skipping product sync. Missing/invalid Trendyol credentials for user ${job.userId}`,
			);
			return false;
		}

		const rawResponse = await this.trendyolService.getProducts(credentials, {
			page: 0,
			size: 10,
		});
		this.logger.debug(`Raw Trendyol response received for user ${job.userId}`);

		const incomingProducts = this.extractProducts(rawResponse);

		if (!incomingProducts.length) {
			this.logger.debug(`No Trendyol products found for user ${job.userId}`);
			return true;
		}

		const allExistingCodes = await this.productRepository.find({
			where: { userId: job.userId },
			select: { urunKodu: true },
		});
		const existingCodeSet = new Set<string>(
			allExistingCodes
				.map((row) => this.toText(row.urunKodu)?.toUpperCase())
				.filter((v): v is string => Boolean(v)),
		);

		let inserted = 0;
		let updated = 0;
		let skipped = 0;

		for (const incoming of incomingProducts) {
			const mapped = this.mapIncomingProduct(incoming, job.userId, entegreKanal);
			if (!mapped) {
				skipped += 1;
				continue;
			}

			const { variants: mappedVariants, ...mappedPazaryeriProductData } =
				mapped.pazaryeriProduct;
		
			const existingPazaryeriProduct = await this.findExistingTrendyolPazaryeriProduct(
				entegreKanal.id,
				mapped.pazaryeriProduct.pazaryeriProductId,
				mapped.pazaryeriProduct.pazaryeriBarcode,
				mapped.pazaryeriProduct.pazaryeriSku,
			);
	
			if (existingPazaryeriProduct) {
				const existingProduct = await this.productRepository.findOne({
					where: { id: existingPazaryeriProduct.productId },
				});

				if (!existingProduct) {
					skipped += 1;
					continue;
				}

				existingProduct.name = existingProduct.name ?? mapped.product.name;
				existingProduct.stock = existingProduct.stock ?? mapped.product.stock ?? null;
				existingProduct.satisFiyati = existingProduct.satisFiyati ?? mapped.product.satisFiyati ?? null;
				existingProduct.listeFiyati = existingProduct.listeFiyati ?? mapped.product.listeFiyati ?? null;
				if (!existingProduct.content && mapped.product.content) {
					existingProduct.content = mapped.product.content;
				}
				if ((!existingProduct.images || existingProduct.images.length === 0) && mapped.product.images) {
					existingProduct.images = mapped.product.images;
				}
				await this.productRepository.save(existingProduct);

				Object.assign(existingPazaryeriProduct, mappedPazaryeriProductData);
				existingPazaryeriProduct.productId = existingProduct.id;
				const savedPazaryeriProduct = await this.pazaryeriProductRepository.save(
					existingPazaryeriProduct,
				);

				await this.syncVariants(
					savedPazaryeriProduct.id,
					mappedVariants,
				);
				updated += 1;
				continue;
			}

			if (!mapped.product.urunKodu) {
				const baseCode = this.generateProductCode(mapped.product.name ?? '');
				const uniqueCode = this.ensureUniqueProductCode(baseCode, existingCodeSet);
				if (uniqueCode) {
					existingCodeSet.add(uniqueCode.toUpperCase());
					mapped.product.urunKodu = uniqueCode;
				}
			}

			const createdProduct = await this.productRepository.save(
				this.productRepository.create(mapped.product),
			);

			const createdPazaryeriProduct = await this.pazaryeriProductRepository.save(
				this.pazaryeriProductRepository.create({
					...mappedPazaryeriProductData,
					productId: createdProduct.id,
				}),
			);

			await this.syncVariants(
				createdPazaryeriProduct.id,
				mappedVariants,
			);
			inserted += 1;
		}

		this.logger.log(
			`Product sync completed for user ${job.userId}. inserted=${inserted}, updated=${updated}, skipped=${skipped}`,
		);
		return true;
	}

	// { Kontrol Edildi }
	private extractProducts(response: unknown): TrendyolIncomingProduct[] {
		if (!response || typeof response !== 'object') {
			return [];
		}

		const source = response as Record<string, unknown>;
		if (!Array.isArray(source.content)) {
			return [];
		}

		return source.content
			.map((raw) => {
				if (!raw || typeof raw !== 'object') {
					return null;
				}

				const row = raw as Record<string, unknown>;

				const variantsRaw = Array.isArray(row.variants)
					? (row.variants as Record<string, unknown>[])
					: [];


				const variants = variantsRaw
					.filter((variant) => variant && typeof variant === 'object')
					.filter((variant) => {
						const archived = variant.archived === true;
						const blacklisted = variant.blacklisted === true;
						const hasViolation = variant.hasViolation === true;
						return !archived && !blacklisted && !hasViolation;
					})
					.map((variant) => {
						const variantPrice =
							(variant.price as { salePrice?: unknown; listPrice?: unknown } | undefined) ??
							undefined;

						return {
							variantId: this.toText(variant.variantId ?? variant.id) ?? null,
							barcode: this.toText(variant.barcode) ?? null,
							title: this.toText(variant.title) ?? this.toText(row.title) ?? null,
							stock: this.toInteger(
								(variant.stock as { quantity?: unknown } | undefined)?.quantity,
							) ?? null,
							salePrice: this.toNumber(variantPrice?.salePrice) ?? null,
							listPrice: this.toNumber(variantPrice?.listPrice) ?? null,
							stockCode: this.toText(variant.stockCode) ?? null,
							vatRate: this.toNumber(variant.vatRate) ?? null,
							productUrl: this.toText(variant.productUrl) ?? null,
							onSale:
								typeof variant.onSale === 'boolean' ? variant.onSale : undefined,
							archived: false,
							blacklisted: false,
							hasViolation: false,
						};
					});

				if (!variants.length) {
					return null;
				}

				return {
					contentId: this.toText(row.contentId) ?? null,
					productMainId: this.toText(row.productMainId) ?? null,
					title: this.toText(row.title) ?? null,
					description: this.toText(row.description) ?? null,
					images: row.images,
					variants,
				} as TrendyolIncomingProduct;
			})
			.filter((item): item is TrendyolIncomingProduct => Boolean(item));
	}

	private mapIncomingProduct(
		item: TrendyolIncomingProduct,
		userId: number,
		entegreKanal: EntegreKanal,
	): MappedMarketplaceProduct | null {
		const primaryVariant = Array.isArray(item.variants) ? item.variants[0] : undefined;
		if (!primaryVariant) {
			return null;
		}

		const name = this.toText(item.title);
		if (!name) {
			return null;
		}

		const barkod = this.toText(primaryVariant.barcode);
		const stokKodu = this.toText(primaryVariant.stockCode);
		const satisFiyati = this.toNumber(primaryVariant.salePrice);
		const listeFiyati = this.toNumber(primaryVariant.listPrice);
		const stock = this.toInteger(primaryVariant.stock);
		const kdv = this.toNumber(primaryVariant.vatRate);
		const salesOpen = primaryVariant.onSale ?? true;
		const images = this.extractImageUrls(item.images);

		const pazaryeriProductId =
			this.toText(item.contentId ?? item.productMainId) ?? stokKodu ?? barkod ?? null;


		return {
			product: {
				name,
				content: this.toText(item.description) ?? null,
				barkod: barkod ?? null,
				stokKodu: stokKodu ?? null,
				urunKodu: null,
				satisFiyati: satisFiyati ?? null,
				listeFiyati: listeFiyati ?? null,
				stock: stock ?? null,
				kdv: kdv ?? null,
				salesOpen,
				images: images.length ? images : null,
				userId,
			},
			pazaryeriProduct: {
				entegreKanalId: entegreKanal.id,
				pazaryeriName: name,
				pazaryeriProductId,
				pazaryeriSku: stokKodu ?? null,
				pazaryeriBarcode: barkod ?? null,
				lastPrice: satisFiyati ?? null,
				lastStock: stock ?? null,
				variants: this.mapIncomingVariants(item.variants),
			},
		};
	}

	private mapIncomingVariants(
		variants: TrendyolIncomingVariant[] | undefined,
	): PazaryeriProductVariantPayload[] {
		if (!Array.isArray(variants) || variants.length === 0) {
			return [];
		}

		return variants
			.map((variant) => ({
				variantId: this.toText(variant.variantId) ?? null,
				barcode: this.toText(variant.barcode) ?? null,
				productUrl: this.toText(variant.productUrl) ?? null,
				onSale: typeof variant.onSale === 'boolean' ? variant.onSale : null,
				stock: this.toInteger(variant.stock) ?? null,
				salePrice: this.toNumber(variant.salePrice) ?? null,
				listPrice: this.toNumber(variant.listPrice) ?? null,
				vatRate: this.toNumber(variant.vatRate) ?? null,
				title: this.toText(variant.title) ?? null,
			}))
			.filter((variant) =>
				Boolean(
					variant.variantId ||
					variant.barcode ||
					variant.stock !== null ||
					variant.salePrice !== null,
				),
			);
	}

	private async findExistingTrendyolPazaryeriProduct(
		entegreKanalId: number,
		pazaryeriProductId: string | null,
		pazaryeriBarcode: string | null,
		pazaryeriSku: string | null,
	): Promise<PazaryeriProduct | null> {
		const where: Array<Record<string, unknown>> = [];

		if (pazaryeriProductId) {
			where.push({ entegreKanalId, pazaryeriProductId });
		}
		if (pazaryeriBarcode) {
			where.push({ entegreKanalId, pazaryeriBarcode });
		}
		if (pazaryeriSku) {
			where.push({ entegreKanalId, pazaryeriSku });
		}

		if (!where.length) {
			return null;
		}

		return this.pazaryeriProductRepository.findOne({ where: where as any });
	}

	private async syncVariants(
		pazaryeriProductId: number,
		variants: PazaryeriProductVariantPayload[],
	): Promise<void> {
		await this.pazaryeriProductVariantRepository.delete({ pazaryeriProductId });

		if (!variants.length) {
			return;
		}

		await this.pazaryeriProductVariantRepository.save(
			variants.map((variant) =>
				this.pazaryeriProductVariantRepository.create({
					pazaryeriProductId,
					...variant,
				}),
			),
		);
	}



	private async resolveEntegreKanalBySlug(
		slug: string | undefined,
	): Promise<EntegreKanal | null> {
		const normalizedSlug = this.toText(slug)?.toLocaleLowerCase('tr-TR');
		if (!normalizedSlug) {
			return null;
		}

		return this.entegreKanalRepository.findOne({
			where: { slug: normalizedSlug },
			select: { id: true, name: true, slug: true, isActive: true, category: true },
		});
	}

	private extractImageUrls(images: unknown): string[] {
		if (!Array.isArray(images)) {
			return [];
		}

		return images
			.map((image) => {
				if (!image || typeof image !== 'object') {
					return null;
				}

				const source = image as Record<string, unknown>;
				return this.toText(source.url);
			})
			.filter((url): url is string => Boolean(url));
	}

	private normalizeToken(token: string): string {
		return token
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/ı/g, 'i')
			.replace(/İ/g, 'I')
			.replace(/ş/g, 's')
			.replace(/Ş/g, 'S')
			.replace(/ğ/g, 'g')
			.replace(/Ğ/g, 'G')
			.replace(/ü/g, 'u')
			.replace(/Ü/g, 'U')
			.replace(/ö/g, 'o')
			.replace(/Ö/g, 'O')
			.replace(/ç/g, 'c')
			.replace(/Ç/g, 'C')
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '');
	}

	private toWordCode(word: string): string {
		if (!word) return '';
		if (/^\d+$/.test(word)) return word;
		if (/^\d/.test(word)) return word[0];
		const first = word[0];
		const rest = word.slice(1).replace(/[AEIOU]/g, '');
		const code = `${first}${rest}`;
		return code || first;
	}

	private generateProductCode(name: string): string {
		const tokens = String(name || '')
			.split(/\s+/)
			.map((token) => this.normalizeToken(token.trim()))
			.filter(Boolean);

		if (!tokens.length) return '';

		const tokenCodes = tokens.map((token) => this.toWordCode(token)).filter(Boolean);
		let selectedCodes = tokenCodes.slice(0, 5);

		if (tokenCodes.length > 5) {
			const lastNumericCode = [...tokenCodes].reverse().find((code) => /^\d$/.test(code));
			if (lastNumericCode) {
				selectedCodes = [...tokenCodes.slice(0, 4), lastNumericCode];
				if (selectedCodes[0]?.length >= 6 && selectedCodes[3]?.length > 1) {
					selectedCodes[3] = selectedCodes[3][0];
				}
			}
		}

		return selectedCodes.join('-');
	}

	private ensureUniqueProductCode(baseCode: string, existingCodes: Set<string>): string {
		if (!baseCode) return '';

		const upper = baseCode.toUpperCase();
		if (!existingCodes.has(upper)) return baseCode;

		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		for (let counter = 0; counter < 1000; counter++) {
			const letter = letters[counter % letters.length];
			const round = Math.floor(counter / letters.length);
			const suffix = round === 0 ? letter : `${letter}${round + 1}`;
			const candidate = `${baseCode}${suffix}`;
			if (!existingCodes.has(candidate.toUpperCase())) return candidate;
		}

		return `${baseCode}-${Date.now().toString().slice(-4)}`;
	}


	private normalizeKey(value: unknown): string | null {
		const text = this.toText(value);
		if (!text) {
			return null;
		}
		return text.toLocaleLowerCase('tr-TR');
	}

	private toText(value: unknown): string | null {
		if (typeof value === 'string') {
			const trimmed = value.trim();
			return trimmed ? trimmed : null;
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return String(value);
		}
		return null;
	}

	private toNumber(value: unknown): number | null {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === 'string') {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : null;
		}
		return null;
	}

	private toInteger(value: unknown): number | null {
		const parsed = this.toNumber(value);
		if (parsed === null) {
			return null;
		}
		return Math.trunc(parsed);
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
}
