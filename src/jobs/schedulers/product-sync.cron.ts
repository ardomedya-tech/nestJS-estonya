import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common';
import { ProductSyncQueue } from '../queues/product-sync.queue';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class ProductSyncCron implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(ProductSyncCron.name);
	private intervalRef: NodeJS.Timeout | null = null;

	constructor(private readonly productSyncQueue: ProductSyncQueue) {}

	onModuleInit(): void {
		const configuredIntervalMs = Number(process.env.PRODUCT_SYNC_INTERVAL_MS);
		const intervalMs = Number.isFinite(configuredIntervalMs)
			? Math.max(60_000, configuredIntervalMs)
			: DEFAULT_INTERVAL_MS;

		this.intervalRef = setInterval(() => {
			void this.run();
		}, intervalMs);

		this.logger.log(`Product sync scheduler started. Interval: ${intervalMs}ms`);
		void this.run();
	}

	onModuleDestroy(): void {
		if (this.intervalRef) {
			clearInterval(this.intervalRef);
			this.intervalRef = null;
		}
	}

	async run(): Promise<void> {
		try {
			await this.productSyncQueue.enqueueEligibleUsers();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error(`Product sync scheduler run failed: ${message}`);
		}
	}
}
