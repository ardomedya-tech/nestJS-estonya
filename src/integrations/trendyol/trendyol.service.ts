import { Injectable, Logger } from '@nestjs/common';
import { TrendyolCredentials } from './dto/trendyol-credentials.dto';

const BASE_URL = 'https://api.trendyol.com/sapigw/suppliers';

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

  private async get<T>(url: string, creds: TrendyolCredentials): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(creds),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Trendyol API error [${response.status}]: ${body}`);
      throw new Error(`Trendyol API [${response.status}]: ${body}`);
    }

    return response.json() as Promise<T>;
  }

  /** Ürün listesini çeker */
  async getProducts(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = `${BASE_URL}/${creds.sellerId}/products${query ? `?${query}` : ''}`;
    return this.get(url, creds);
  }

  /** Sipariş listesini çeker */
  async getOrders(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = `${BASE_URL}/${creds.sellerId}/orders${query ? `?${query}` : ''}`;
    return this.get(url, creds);
  }

  /** Tek ürün çeker */
  async getProductById(
    creds: TrendyolCredentials,
    barcode: string,
  ): Promise<unknown> {
    const url = `${BASE_URL}/${creds.sellerId}/products?barcode=${encodeURIComponent(barcode)}`;
    return this.get(url, creds);
  }

  /** Stok ve fiyat güncellemesi için mevcut stok/fiyat bilgisini çeker */
  async getProductStockAndPrice(
    creds: TrendyolCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = `${BASE_URL}/${creds.sellerId}/products/price-and-inventory${query ? `?${query}` : ''}`;
    return this.get(url, creds);
  }

  /** Kargo şirketlerini çeker */
  async getShipmentProviders(creds: TrendyolCredentials): Promise<unknown> {
    const url = `${BASE_URL}/${creds.sellerId}/shipment-providers`;
    return this.get(url, creds);
  }

  /** Kategori listesini çeker */
  async getCategories(creds: TrendyolCredentials): Promise<unknown> {
    const url = `https://api.trendyol.com/sapigw/product-categories`;
    return this.get(url, creds);
  }
}
