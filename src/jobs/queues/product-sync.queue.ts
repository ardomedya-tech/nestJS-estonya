import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntegre } from '../../modules/user-entegre/user-entegre.entity';
import { ProductSyncProcessor } from '../processors/product-sync.processor';
import { Repository } from 'typeorm';

@Injectable()
export class ProductSyncQueue {
	private readonly logger = new Logger(ProductSyncQueue.name);

	constructor(
		@InjectRepository(UserEntegre)
		private readonly userEntegreRepository: Repository<UserEntegre>,
		private readonly productSyncProcessor: ProductSyncProcessor,
	) {}

	async enqueueEligibleUsers(): Promise<number> {
		const activeTrendyolIntegrations = await this.userEntegreRepository.find({
			where: {
				status: true,
				entegreKanal: {
					slug: 'trendyol',
					isActive: true,
				},
			},
			relations: { entegreKanal: true },
			order: { id: 'DESC' },
		});

		if (!activeTrendyolIntegrations.length) {
			this.logger.debug('No active trendyol integrations found for product sync');
			return 0;
		}

		const latestIntegrationByUser = new Map<number, UserEntegre>();
		for (const integration of activeTrendyolIntegrations) {
			if (!latestIntegrationByUser.has(integration.userId)) {
				latestIntegrationByUser.set(integration.userId, integration);
			}
		}

		let processedCount = 0;

		for (const integration of latestIntegrationByUser.values()) {
			try {
				const processed = await this.productSyncProcessor.process({
					userId: integration.userId,
					userEntegreId: integration.id,
				});

				if (processed) {
					processedCount += 1;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				this.logger.error(
					`Product sync failed for user ${integration.userId}: ${message}`,
				);
			}
		}

		this.logger.log(`Product sync queue run finished. Processed users: ${processedCount}`);
		return processedCount;
	}
}
