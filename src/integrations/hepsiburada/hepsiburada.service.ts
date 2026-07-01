import { Injectable, Logger } from '@nestjs/common';
import { HepsiburadaCredentials } from './dto/hepsiburada-credentials.dto';

export interface HepsiburadaQuestionItem {
  id?: string | number;
  text?: string;
  productName?: string;
  expireDate?: string;
}

@Injectable()
export class HepsiburadaService {
  private readonly logger = new Logger(HepsiburadaService.name);

  private buildHeaders(creds: HepsiburadaCredentials): HeadersInit {
    const token = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    return {
      Authorization: `Basic ${token}`,
      merchantId: creds.merchantId,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    url: string,
    creds: HepsiburadaCredentials,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(creds),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.text();
      this.logger.error(`Hepsiburada API error [${response.status}]: ${payload}`);
      throw new Error(`Hepsiburada API [${response.status}]: ${payload}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();
    return ({ ok: true, raw: text } as unknown) as T;
  }

  async getProducts(
    creds: HepsiburadaCredentials,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    this.logger.log(
      `Hepsiburada product fetch initialized for merchant ${creds.merchantId}`,
    );

    return {
      provider: 'hepsiburada',
      merchantId: creds.merchantId,
      params,
      message: 'Hepsiburada integration request prepared.',
    };
  }

  async getQuestions(
    creds: HepsiburadaCredentials,
    params: Record<string, string | number> = {},
  ): Promise<HepsiburadaQuestionItem[]> {
    const query = new URLSearchParams(
      Object.entries({
        status: 1,
        limit: 50,
        offset: 0,
        sortBy: 0,
        ...params,
      }).map(([key, value]) => [key, String(value)]),
    ).toString();

    const url = `https://mpop.hepsiburada.com/questions/api/questions/sellers/${creds.merchantId}?${query}`;
    const response = (await this.request(url, creds)) as { data?: unknown[] };

    return Array.isArray(response?.data)
      ? (response.data as HepsiburadaQuestionItem[])
      : [];
  }

  async sendAnswer(
    creds: HepsiburadaCredentials,
    questionId: string,
    text: string,
  ): Promise<unknown> {
    const url = `https://mpop.hepsiburada.com/questions/api/questions/${encodeURIComponent(questionId)}/answer`;
    return this.request(url, creds, 'POST', { text });
  }
}
