import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrendyolCredentials } from '../../integrations/trendyol/dto/trendyol-credentials.dto';
import { TrendyolService } from '../../integrations/trendyol/trendyol.service';
import { PazaryeriOrderTrendyolService } from '../../modules/pazaryeri-order-trendyol/pazaryeri-order-trendyol.service';
import { UserEntegre } from '../../modules/user-entegre/user-entegre.entity';
import { decrypt } from '../../utils/encryption.util';
import { Repository } from 'typeorm';

export interface OrderSyncJob {
  userId: number;
  userEntegreId: number;
}

@Injectable()
export class OrderSyncProcessor {
  private readonly logger = new Logger(OrderSyncProcessor.name);

  constructor(
    @InjectRepository(UserEntegre)
    private readonly userEntegreRepository: Repository<UserEntegre>,
    private readonly trendyolService: TrendyolService,
    private readonly pazaryeriOrderTrendyolService: PazaryeriOrderTrendyolService,
  ) {}

  async process(job: OrderSyncJob): Promise<boolean> {
    const userEntegre = await this.userEntegreRepository.findOne({
      where: { id: job.userEntegreId, userId: job.userId },
      relations: { entegreKanal: true },
    });

    if (!userEntegre) {
      this.logger.warn(`UserEntegre not found for job: ${JSON.stringify(job)}`);
      return false;
    }

    if (!userEntegre.status) {
      this.logger.debug(`Skipping order sync. status=false for user ${job.userId}`);
      return false;
    }

    if (userEntegre.entegreKanal?.slug !== 'trendyol') {
      this.logger.debug(
        `Skipping order sync. entegreKanal is not trendyol for user ${job.userId}`,
      );
      return false;
    }

    const credentials = this.parseCredentials(userEntegre.apiData);
    if (!credentials) {
      this.logger.warn(
        `Skipping order sync. Missing/invalid Trendyol credentials for user ${job.userId}`,
      );
      return false;
    }

    const now = Date.now();
    const safeLookbackMs = 3 * 24 * 60 * 60 * 1000;

    const ordersResponse = (await this.trendyolService.getOrders(credentials, {
      startDate: now - safeLookbackMs,
      endDate: now,
      page: 0,
      size: 10,
    })) as {
      content?: Array<Record<string, any>>;
    };

    const TYOrders = ordersResponse.content ?? [];

    const syncStats = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const order of TYOrders) {
      try {
        const result = await this.pazaryeriOrderTrendyolService.upsertFromTrendyolPayload(
          order,
          job.userId,
          job.userEntegreId,
        );

        if (result.action === 'created') {
          syncStats.created += 1;
          continue;
        }

        if (result.action === 'updated') {
          syncStats.updated += 1;
          continue;
        }

        syncStats.skipped += 1;

        if (result.reason) {
          this.logger.debug(
            `Order skipped for user ${job.userId}. orderNumber=${result.orderNumber ?? 'N/A'} reason=${result.reason}`,
          );
        }
      } catch (error) {
        syncStats.skipped += 1;
        const errorMessage = error instanceof Error ? error.message : 'unknown-error';
        this.logger.warn(
          `Order sync failed for single record. user=${job.userId} message=${errorMessage}`,
        );
      }
    }

    this.logger.log(
      `Order sync completed for user ${job.userId}. created=${syncStats.created} updated=${syncStats.updated} skipped=${syncStats.skipped} fetched=${TYOrders.length}`,
    );
    return true;
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
