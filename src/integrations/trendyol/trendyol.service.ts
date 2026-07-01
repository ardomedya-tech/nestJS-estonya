import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TrendyolCredentials } from './dto/trendyol-credentials.dto';

const STAGE_BASE_URL = 'https://stageapigw.trendyol.com/integration';
const PROD_BASE_URL = 'https://apigw.trendyol.com/integration';

export interface TrendyolQuestionItem {
  id?: string | number;
  text?: string;
  productName?: string;
  customerFirstName?: string;
}

export interface TrendyolInventoryPriceUpdateItem {
  barcode: string;
  quantity?: number;
  salePrice?: number;
  listPrice?: number;
}

export interface TrendyolProductContentImage {
  url: string;
}

export interface TrendyolProductContentAttribute {
  attributeId: number;
  attributeValueId?: number;
  customAttributeValue?: string;
}

export interface TrendyolProductContentUpdateItem {
  contentId: number;
  title?: string;
  description?: string;
  images?: TrendyolProductContentImage[];
  vatRate?: number;
  attributes?: TrendyolProductContentAttribute[];
}

@Injectable()
export class TrendyolService {
  private readonly logger = new Logger(TrendyolService.name);

  private buildHeaders(creds: TrendyolCredentials): HeadersInit {
    const token = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString('base64');
    return {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': `${creds.sellerId} - SelfIntegration`,
    };
  }

  private async request<T>(
    url: string,
    creds: TrendyolCredentials,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(creds),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Trendyol API error [${response.status}]: ${body}`);

      if (response.status === 400) {
        try {
          const parsed = JSON.parse(body) as {
            errors?: Array<{ key?: string; message?: string }>;
          };

          const hasRecurringUpdateError = parsed.errors?.some(
            (error) => error?.key === 'batchRequest.recurring.product.update.not.allowed',
          );

          if (hasRecurringUpdateError) {
            throw new BadRequestException(
              'Aynı gün içinde birden fazla ürün fiyatı ve stock güncellenemez',
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
        }
      }

      throw new Error(`Trendyol API [${response.status}]: ${body}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();
    return ({ ok: true, raw: text } as unknown) as T;
  }

  private async requestWithFallback<T>(
    buildPath: (baseUrl: string) => string,
    creds: TrendyolCredentials,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const stageUrl = buildPath(STAGE_BASE_URL);

    try {
      return await this.request<T>(stageUrl, creds, method, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('401')) {
        throw error;
      }

      this.logger.warn(
        'Trendyol stage kimlik doğrulaması başarısız. Prod endpoint ile yeniden denenecek.',
      );

      const prodUrl = buildPath(PROD_BASE_URL);
      return this.request<T>(prodUrl, creds, method, body);
    }
  }

  /** Ürün listesini çeker */
  async getProducts(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/product/sellers/${creds.sellerId}/products/approved${query ? `?${query}` : ''}`,
      creds,
    );
  }

  /** Sipariş listesini çeker */
  async getOrders(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/product/sellers/${creds.sellerId}/orders${query ? `?${query}` : ''}`,
      creds,
    );
  }

  /** Tek ürün çeker */
  async getProductById(
    creds: TrendyolCredentials,
    barcode: string,
  ): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/product/sellers/${creds.sellerId}/products?barcode=${encodeURIComponent(barcode)}`,
      creds,
    );
  }

  /** Stok ve fiyat güncellemesi için mevcut stok/fiyat bilgisini çeker */
  async getProductStockAndPrice(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/product/sellers/${creds.sellerId}/products/approved/inventory-and-price${query ? `?${query}` : ''}`,
      creds,
    );
  }

  // https://stageapigw.trendyol.com/integration/product/sellers/{sellerId}/products/content-bulk-update
// {
// "items": [
//     {
//         "contentId": 9510902,
//         "title": "string",
//         "description": "string",
//         "images": [
//             {
//                 "url": "string"
//             }
//         ],
//          "vatRate": 123,
//         "attributes": [
//             {
//                 "attributeId": 1,
//                 "attributeValueId": 1
//             },
//             {
//                 "attributeId": 2,
//                 "customAttributeValue": "String"
//             }
//         ]
//     }
// ]
// }

  async updateProductContentBulk(
    creds: TrendyolCredentials,
    items: TrendyolProductContentUpdateItem[],
  ): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/product/sellers/${creds.sellerId}/products/content-bulk-update`,
      creds,
      'POST',
      { items },
    );
  }

// https://stageapigw.trendyol.com/integration/inventory/sellers/{sellerId}/products/price-and-inventory

// {
//   "items": [
//     {
//       "barcode": "8680000000",
//       "quantity": 100,
//       "salePrice": 112.85,
//       "listPrice": 113.85
//     }
//   ]
// }
  async updateProductPriceAndInventory(
    creds: TrendyolCredentials,
    items: TrendyolInventoryPriceUpdateItem[],
  ): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/inventory/sellers/${creds.sellerId}/products/price-and-inventory`,
      creds,
      'POST',
      { items },
    );
  }

  /** Kargo şirketlerini çeker */
  async getShipmentProviders(creds: TrendyolCredentials): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) => `${baseUrl}/product/sellers/${creds.sellerId}/shipment-providers`,
      creds,
    );
  }

  /** Kategori listesini çeker */
  async getCategories(creds: TrendyolCredentials): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) => `${baseUrl}/product-categories`,
      creds,
    );
  }

  /** Cevap bekleyen soruları çeker */
  async getQuestions(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<TrendyolQuestionItem[]> {
    const now = Date.now();
    const defaultStart = now - 2 * 24 * 60 * 60 * 1000;
    const query = new URLSearchParams(
      Object.entries({
        startDate: defaultStart,
        endDate: now,
        status: 'WAITING_FOR_ANSWER',
        size: 50,
        ...params,
      }).map(([k, v]) => [k, String(v)]),
    ).toString();

    const result = (await this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/qna/sellers/${creds.sellerId}/questions/filter?${query}`,
      creds,
    )) as { content?: unknown[] };

   
    return Array.isArray(result?.content)
      ? (result.content as TrendyolQuestionItem[])
      : [];
  }

  /** Soruya cevap gönderir */
  async sendAnswer(
    creds: TrendyolCredentials,
    questionId: string,
    text: string,
  ): Promise<unknown> {
    return this.requestWithFallback(
      (baseUrl) =>
        `${baseUrl}/qna/sellers/${creds.sellerId}/questions/${encodeURIComponent(questionId)}/answers`,
      creds,
      'POST',
      { text },
    );
  }
}
