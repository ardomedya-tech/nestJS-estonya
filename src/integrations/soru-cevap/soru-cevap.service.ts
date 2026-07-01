import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Soru } from './entities/soru.entity';
import { GonderilenCevap } from './entities/gonderilen-cevap.entity';
import { GecmisCevap } from './entities/gecmis-cevap.entity';
import { UserEntegre } from '../../modules/user-entegre/user-entegre.entity';
import {
  TrendyolQuestionItem,
  TrendyolService,
} from '../trendyol/trendyol.service';
import {
  HepsiburadaQuestionItem,
  HepsiburadaService,
} from '../hepsiburada/hepsiburada.service';
import { TrendyolCredentials } from '../trendyol/dto/trendyol-credentials.dto';
import { HepsiburadaCredentials } from '../hepsiburada/dto/hepsiburada-credentials.dto';
import { decrypt } from '../../utils/encryption.util';

type SoruDurum = 'bekliyor' | 'gonderildi' | 'reddedildi';
type PlatformSlug = 'trendyol' | 'hepsiburada';

interface AICevapSonucu {
  cevap: string;
  guvenSkor: number;
  kategori: string;
  ornekSayisi: number;
}

interface NormalizedQuestion {
  platform: PlatformSlug;
  platformSoruId: string;
  soru: string;
  urunAdi: string | null;
  musteriAdi: string | null;
}

@Injectable()
export class SoruCevapService {
  private readonly logger = new Logger(SoruCevapService.name);

  constructor(
    @InjectRepository(Soru)
    private readonly soruRepository: Repository<Soru>,
    @InjectRepository(GonderilenCevap)
    private readonly gonderilenCevapRepository: Repository<GonderilenCevap>,
    @InjectRepository(GecmisCevap)
    private readonly gecmisCevapRepository: Repository<GecmisCevap>,
    @InjectRepository(UserEntegre)
    private readonly userEntegreRepository: Repository<UserEntegre>,
    private readonly trendyolService: TrendyolService,
    private readonly hepsiburadaService: HepsiburadaService,
  ) {}

  async bekleyenSorulariGetir(limit: number = 10, userId?: number) {
    const query = this.soruRepository
      .createQueryBuilder('soru')
      .leftJoinAndSelect('soru.userEntegre', 'userEntegre')
      .leftJoinAndSelect('userEntegre.entegreKanal', 'entegreKanal')
      .where('soru.durum = :durum', { durum: 'bekliyor' })
      .andWhere('userEntegre.soruCevapSync = :soruCevapSync', { soruCevapSync: true })
      .orderBy('soru.olusturulma', 'ASC')
      .take(limit);

    if (typeof userId === 'number') {
      query.andWhere('userEntegre.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async sorulariListele(userId: number, durum?: SoruDurum, limit: number = 100) {
    const query = this.soruRepository
      .createQueryBuilder('soru')
      .leftJoinAndSelect('soru.userEntegre', 'userEntegre')
      .leftJoinAndSelect('userEntegre.entegreKanal', 'entegreKanal')
      .where('userEntegre.userId = :userId', { userId })
      .orderBy('soru.olusturulma', 'DESC')
      .take(limit);

    if (durum) {
      query.andWhere('soru.durum = :durum', { durum });
    }

    return query.getMany();
  }

  async benzerSoruBul(
    soru: string,
    userEntegreId: number,
    platform: string,
  ): Promise<GecmisCevap[]> {
    const words = soru
      .toLocaleLowerCase('tr-TR')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2)
      .slice(0, 5);

    const baseQuery = this.gecmisCevapRepository
      .createQueryBuilder('gc')
      .where('gc.userEntegreId = :userEntegreId', { userEntegreId })
      .andWhere('gc.platform = :platform', { platform });

    if (words.length > 0) {
      baseQuery.andWhere(
        new Brackets((qb) => {
          words.forEach((word, index) => {
            qb.orWhere(`LOWER(gc.soru) LIKE :word${index}`, {
              [`word${index}`]: `%${word}%`,
            });
          });
        }),
      );
    }

    const matched = await baseQuery
      .orderBy('gc.kullanimSayisi', 'DESC')
      .addOrderBy('gc.olusturulma', 'DESC')
      .take(5)
      .getMany();

    if (matched.length > 0) {
      return matched;
    }

    return this.gecmisCevapRepository.find({
      where: { userEntegreId, platform },
      order: { kullanimSayisi: 'DESC', olusturulma: 'DESC' },
      take: 5,
    });
  }

  async aiCevapUret(input: {
    soru: string;
    platform: string;
    urunAdi?: string | null;
    userEntegreId: number;
  }): Promise<AICevapSonucu> {
    const kategori = this.kategoriTahminEt(input.soru);
    const firmaBilgileri = await this.getFirmaBilgileriText(input.userEntegreId);
    const benzerler = await this.benzerSoruBul(
      input.soru,
      input.userEntegreId,
      input.platform,
    );

    const ornekler = benzerler
      .map(
        (row, i) =>
          `Ornek ${i + 1}:\nSoru: "${row.soru}"\nCevap: "${row.cevap}"`,
      )
      .join('\n\n');

          const prompt = `
Sen ${input.platform === 'trendyol' ? 'Trendyol' : 'Hepsiburada'} üzerinde satış yapan bir Türk e-ticaret mağazasının resmi müşteri temsilcisisin.

${input.urunAdi ? `Ürün: ${input.urunAdi}` : ""}
Soru kategorisi: ${kategori}

========================
MAĞAZA BİLGİLERİ
========================
${firmaBilgileri}

Bu bilgiler mağazanın resmi politikalarıdır.
Cevap üretirken öncelikle bu bilgileri kullan.
Bilgi burada varsa asla kendi yorumunu ekleme.
Bilgi burada yoksa genel müşteri temsilcisi dili kullan.

========================
ÖNCEKİ CEVAP ÖRNEKLERİ
========================
${ornekler}

Bu örneklerdeki:
- hitap şekli
- cümle uzunluğu
- kelime seçimi
- üslup
- kapanış tarzı

korunmalıdır.

========================
MÜŞTERİ SORUSU
========================
"${input.soru}"

========================
KURALLAR
========================
1. Önce mağaza bilgilerini kullan.
2. Sonra gerekiyorsa örneklerdeki üslubu uygula.
3. Bilmediğin hiçbir teknik bilgi uydurma.
4. Kesin olmayan bilgiler için "ürün bazında değişebilir" gibi ifadeler kullan.
5. Gereksiz özür dileme.
6. Satışı destekleyen güven verici ifadeler kullan.
7. Maksimum 4 cümle.
8. Türkçe yaz.
9. Gerekiyorsa satır başı kullan.
10. Emoji en fazla 1 adet.
11. Sadece cevabı yaz.
`;
     
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5.5",
          input: prompt
        })
      });



    
    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Claude API [${response.status}]: ${payload}`);
    }

    const data = (await response.json()) as {
      output?:
        | string
        | Array<{
            status?: string;
            phase?: string;
            content?: Array<{ text?: string }>;
          }>;
    };

    let output: unknown = data.output;
    if (typeof output === 'string') {
      try {
        output = JSON.parse(output) as unknown;
      } catch {
        output = [];
      }
    }

    const finalAnswer = Array.isArray(output)
      ? output.find(
          (
            item,
          ): item is {
            status?: string;
            phase?: string;
            content?: Array<{ text?: string }>;
          } =>
            Boolean(
              item &&
                typeof item === 'object' &&
                item.status === 'completed' &&
                item.phase === 'final_answer',
            ),
        )
      : undefined;

    const cevap = finalAnswer?.content?.[0]?.text?.trim() ?? null;

    if (!cevap) {
      throw new Error('Claude API bos cevap dondu');
    }

    const baseSkor = benzerler.length >= 2 ? 0.85 : benzerler.length === 1 ? 0.7 : 0.55;
    const lengthBonus = cevap.length > 50 ? 0.05 : 0;


    return {
      cevap,
      guvenSkor: Math.min(0.95, baseSkor + lengthBonus),
      kategori,
      ornekSayisi: benzerler.length,
    };
  }

  async cevapGonder(
    soruId: number,
    cevap: string,
    platform: string,
    otomatikMi: boolean = false,
    platformYaniti?: Record<string, unknown>,
    basariliMi: boolean = true,
  ) {
    const gonderilenCevap = this.gonderilenCevapRepository.create({
      soruId,
      cevap,
      platform,
      otomatikMi,
      platformYaniti: platformYaniti || null,
      basariliMi,
      gonderilenZaman: new Date(),
    });

    return this.gonderilenCevapRepository.save(gonderilenCevap);
  }

  async soruDurumGuncelle(soruId: number, yeniDurum: SoruDurum) {
    return this.soruRepository.update({ id: soruId }, { durum: yeniDurum });
  }

  async gecmisCevapEkle(
    soru: string,
    cevap: string,
    userEntegreId: number,
    platform: string,
    kategori?: string,
  ) {
    const gecmisCevap = this.gecmisCevapRepository.create({
      soru,
      cevap,
      userEntegreId,
      platform,
      kategori,
      kullanimSayisi: 0,
    });

    return this.gecmisCevapRepository.save(gecmisCevap);
  }

  async soruEkle(
    platform: string,
    platformSoruId: string,
    soru: string,
    urunAdi: string | null,
    musteriAdi: string | null,
    userEntegreId: number,
  ) {
    const yeniSoru = this.soruRepository.create({
      platform,
      platformSoruId,
      soru,
      urunAdi,
      musteriAdi,
      userEntegreId,
      durum: 'bekliyor',
    });

    return this.soruRepository.save(yeniSoru);
  }

  async platformlardanSorulariCek(userId?: number) {
    const where: Record<string, unknown> = {
      status: true,
      soruCevapSync: true,
      entegreKanal: { slug: In(['trendyol', 'hepsiburada']) },
    };

    if (typeof userId === 'number') {
      where.userId = userId;
    }

    const entegrasyonlar = await this.userEntegreRepository.find({
      where,
      relations: { entegreKanal: true },
      order: { id: 'DESC' },
    });

    let pulled = 0;
    let inserted = 0;

    for (const entegrasyon of entegrasyonlar) {
      const slug = entegrasyon.entegreKanal?.slug as PlatformSlug | undefined;
      if (!slug || (slug !== 'trendyol' && slug !== 'hepsiburada')) {
        continue;
      }

      try {
        const list = await this.platformSorulariniCek(entegrasyon, slug);
        pulled += list.length;
       
      for (const item of list) {
          const exists = await this.soruRepository.findOne({
            where: { platformSoruId: item.platformSoruId },
            select: { id: true },
          });

          if (exists) {
            continue;
          }

          await this.soruEkle(
            item.platform,
            item.platformSoruId,
            item.soru,
            item.urunAdi,
            item.musteriAdi,
            entegrasyon.id,
          );
          inserted += 1;
        }
      } catch (error) {
        this.logger.error(
          `Soru cekme hatasi. userEntegreId=${entegrasyon.id}, platform=${slug}, error=${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { pulled, inserted };
  }

  async bekleyenSorulariIsle(userId?: number, autoSendThreshold: number = 0.75) {
    const sorular = await this.bekleyenSorulariGetir(50, userId);
   let generated = 0;
    let autoSent = 0;

    for (const soru of sorular) {
      try {
        const aiSonucu = await this.aiCevapUret({
          soru: soru.soru,
          platform: soru.platform,
          urunAdi: soru.urunAdi,
          userEntegreId: soru.userEntegreId,
        });
        generated += 1;

        await this.soruRepository.update(
          { id: soru.id },
          {
            aiCevap: aiSonucu.cevap,
            guvenSkor: aiSonucu.guvenSkor,
            kategori: aiSonucu.kategori,
          },
        );

        if (aiSonucu.guvenSkor >= autoSendThreshold) {
          const sent = await this.otomatikCevapGonder(
            soru.id,
            aiSonucu.cevap,
            aiSonucu.guvenSkor,
          );
          if (sent.sent) {
            autoSent += 1;
          }
        }
      } catch (error) {
        this.logger.error(
          `Bekleyen soru işleme hatası. soruId=${soru.id}, error=${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { total: sorular.length, generated, autoSent };
  }

  async cronTaraVeIsle(userId?: number, autoSendThreshold: number = 0.75) {
    const fetchResult = await this.platformlardanSorulariCek(userId);
    const processResult = await this.bekleyenSorulariIsle(userId, autoSendThreshold);

    return {
      fetch: fetchResult,
      process: processResult,
    };
  }

  async soruIsle(userId: number, soruId: number, autoSendThreshold: number = 0.75) {
    const soru = await this.soruRepository
      .createQueryBuilder('soru')
      .leftJoinAndSelect('soru.userEntegre', 'userEntegre')
      .leftJoinAndSelect('userEntegre.entegreKanal', 'entegreKanal')
      .where('soru.id = :soruId', { soruId })
      .andWhere('userEntegre.userId = :userId', { userId })
      .getOne();

    if (!soru) {
      throw new NotFoundException('Soru bulunamadi');
    }

    if (!soru.userEntegre?.soruCevapSync) {
      throw new BadRequestException('Bu entegrasyon icin soru-cevap senkronizasyonu kapali');
    }

    const aiSonucu = await this.aiCevapUret({
      soru: soru.soru,
      platform: soru.platform,
      urunAdi: soru.urunAdi,
      userEntegreId: soru.userEntegreId,
    });

    await this.soruRepository.update(
      { id: soru.id },
      {
        aiCevap: aiSonucu.cevap,
        guvenSkor: aiSonucu.guvenSkor,
        kategori: aiSonucu.kategori,
      },
    );

    const sentResult =
      aiSonucu.guvenSkor >= autoSendThreshold
        ? await this.otomatikCevapGonder(soru.id, aiSonucu.cevap, aiSonucu.guvenSkor)
        : { sent: false };

    return {
      soruId: soru.id,
      ai: aiSonucu,
      gonderildi: Boolean(sentResult.sent),
      durum: sentResult.sent ? 'gonderildi' : 'bekliyor',
    };
  }

  async manuelOnayla(
    userId: number,
    soruId: number,
    durum: SoruDurum,
    duzenlenmisCevap?: string,
  ) {
    const soru = await this.soruRepository
      .createQueryBuilder('soru')
      .leftJoinAndSelect('soru.userEntegre', 'userEntegre')
      .leftJoinAndSelect('userEntegre.entegreKanal', 'entegreKanal')
      .where('soru.id = :soruId', { soruId })
      .andWhere('userEntegre.userId = :userId', { userId })
      .getOne();

    if (!soru) {
      throw new NotFoundException('Soru bulunamadi');
    }

    if (durum === 'reddedildi') {
      await this.soruRepository.update(
        { id: soru.id },
        { durum: 'reddedildi', duzenlenmisCevap: duzenlenmisCevap ?? null },
      );
      return { success: true, durum: 'reddedildi' };
    }

    const cevap = (duzenlenmisCevap ?? soru.aiCevap ?? '').trim();
    if (!cevap) {
      throw new BadRequestException('Gonderilecek cevap bos olamaz');
    }

    const platformYaniti = await this.platformaCevapGonder(soru, cevap);
    await this.cevapGonder(soru.id, cevap, soru.platform, false, platformYaniti, true);

    await this.soruRepository.update(
      { id: soru.id },
      { durum: 'gonderildi', duzenlenmisCevap: duzenlenmisCevap ?? null },
    );

    await this.gecmisCevapEkle(
      soru.soru,
      cevap,
      soru.userEntegreId,
      soru.platform,
      soru.kategori ?? undefined,
    );

    return { success: true, durum: 'gonderildi' };
  }

  async otomatikCevapGonder(soruId: number, aiCevap: string, guvenSkor: number) {
    if (guvenSkor < 0.75) {
      return { sent: false, automatic: false, reason: 'Low confidence score' };
    }

    const soru = await this.soruRepository.findOne({
      where: { id: soruId },
      relations: { userEntegre: { entegreKanal: true } },
    });

    if (!soru) {
      return { sent: false, automatic: true, reason: 'Question not found' };
    }

    try {
      const platformYaniti = await this.platformaCevapGonder(soru, aiCevap);
      await this.cevapGonder(soru.id, aiCevap, soru.platform, true, platformYaniti, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.cevapGonder(
        soru.id,
        aiCevap,
        soru.platform,
        true,
        { error: message },
        false,
      );
      return { sent: false, automatic: true, reason: message };
    }

    await this.soruDurumGuncelle(soruId, 'gonderildi');
    await this.gecmisCevapEkle(
      soru.soru,
      aiCevap,
      soru.userEntegreId,
      soru.platform,
      soru.kategori ?? undefined,
    );

    return { sent: true, automatic: true };
  }

  private async platformSorulariniCek(
    entegrasyon: UserEntegre,
    platform: PlatformSlug,
  ): Promise<NormalizedQuestion[]> {
    if (platform === 'trendyol') {
      const credentials = this.parseTrendyolCredentials(entegrasyon.apiData);
      if (!credentials) {
        return [];
      }

      const rows = await this.trendyolService.getQuestions(credentials);
      return rows
        .map((row) => this.normalizeTrendyolQuestion(row))
        .filter((item): item is NormalizedQuestion => Boolean(item));
    }

    const credentials = this.parseHepsiburadaCredentials(entegrasyon.apiData);
    if (!credentials) {
      return [];
    }

    const rows = await this.hepsiburadaService.getQuestions(credentials);
    return rows
      .map((row) => this.normalizeHepsiburadaQuestion(row))
      .filter((item): item is NormalizedQuestion => Boolean(item));
  }

  private normalizeTrendyolQuestion(
    item: TrendyolQuestionItem,
  ): NormalizedQuestion | null {
    const rawId = this.toText(item.id);
    const soru = this.toText(item.text);
    if (!rawId || !soru) {
      return null;
    }

    return {
      platform: 'trendyol',
      platformSoruId: `trendyol:${rawId}`,
      soru,
      urunAdi: this.toText(item.productName),
      musteriAdi: this.toText(item.customerFirstName) ?? 'Musteri',
    };
  }

  private normalizeHepsiburadaQuestion(
    item: HepsiburadaQuestionItem,
  ): NormalizedQuestion | null {
    const rawId = this.toText(item.id);
    const soru = this.toText(item.text);
    if (!rawId || !soru) {
      return null;
    }

    return {
      platform: 'hepsiburada',
      platformSoruId: `hepsiburada:${rawId}`,
      soru,
      urunAdi: this.toText(item.productName),
      musteriAdi: 'Musteri',
    };
  }

  private async platformaCevapGonder(
    soru: Soru,
    cevap: string,
  ): Promise<Record<string, unknown>> {
    const integration = await this.userEntegreRepository.findOne({
      where: { id: soru.userEntegreId },
      relations: { entegreKanal: true },
    });

    if (!integration?.entegreKanal?.slug) {
      throw new BadRequestException('Platform entegrasyonu bulunamadi');
    }

    const platform = integration.entegreKanal.slug as PlatformSlug;
    const questionId = this.extractRawPlatformQuestionId(soru.platformSoruId, platform);
    if (!questionId) {
      throw new BadRequestException('Platform soru id bulunamadi');
    }

    if (platform === 'trendyol') {
      const creds = this.parseTrendyolCredentials(integration.apiData);
      if (!creds) {
        throw new BadRequestException('Trendyol credentials bulunamadi');
      }

      const response = await this.trendyolService.sendAnswer(creds, questionId, cevap);
      return { provider: 'trendyol', response: response as Record<string, unknown> };
    }

    const creds = this.parseHepsiburadaCredentials(integration.apiData);
    if (!creds) {
      throw new BadRequestException('Hepsiburada credentials bulunamadi');
    }

    const response = await this.hepsiburadaService.sendAnswer(creds, questionId, cevap);
    return { provider: 'hepsiburada', response: response as Record<string, unknown> };
  }

  private extractRawPlatformQuestionId(
    storedId: string | null,
    platform: PlatformSlug,
  ): string | null {
    const value = this.toText(storedId);
    if (!value) {
      return null;
    }

    const prefix = `${platform}:`;
    if (!value.startsWith(prefix)) {
      return value;
    }

    const raw = value.slice(prefix.length).trim();
    return raw || null;
  }

  private parseTrendyolCredentials(
    encryptedApiData: string | null,
  ): TrendyolCredentials | null {
    const source = this.parseApiData(encryptedApiData);
    if (!source) {
      return null;
    }

    const sellerId = this.pickFirstText(source, ['sellerId', 'supplierId']);
    const apiKey = this.pickFirstText(source, ['apiKey', 'apikey']);
    const apiSecret = this.pickFirstText(source, ['apiSecret', 'secret']);

    if (!sellerId || !apiKey || !apiSecret) {
      return null;
    }

    return { sellerId, apiKey, apiSecret };
  }

  private parseHepsiburadaCredentials(
    encryptedApiData: string | null,
  ): HepsiburadaCredentials | null {
    const source = this.parseApiData(encryptedApiData);
    if (!source) {
      return null;
    }

    const merchantId = this.pickFirstText(source, ['merchantId', 'sellerId']);
    const username = this.pickFirstText(source, ['username', 'user', 'apiKey']);
    const password = this.pickFirstText(source, ['password', 'pass', 'apiSecret']);

    if (!merchantId || !username || !password) {
      return null;
    }

    return { merchantId, username, password };
  }

  private parseApiData(encryptedApiData: string | null): Record<string, unknown> | null {
    if (!encryptedApiData) {
      return null;
    }

    try {
      const decrypted = decrypt(encryptedApiData);
      const parsed = JSON.parse(decrypted) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  private async getFirmaBilgileriText(userEntegreId: number): Promise<string> {
    const entegrasyon = await this.userEntegreRepository.findOne({
      where: { id: userEntegreId },
      relations: { user: true },
      select: {
        id: true,
        user: {
          id: true,
          firmaBilgileri: true,
        },
      },
    });

    const bilgiler = entegrasyon?.user?.firmaBilgileri;
    if (!Array.isArray(bilgiler) || bilgiler.length === 0) {
      return 'Firma bilgisi bulunamadi.';
    }

    return bilgiler
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .join('\n- ')
      .replace(/^/, '- ');
  }

  private pickFirstText(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = this.toText(source[key]);
      if (value) {
        return value;
      }
    }
    return null;
  }

  private kategoriTahminEt(soru: string): string {
    const lower = soru.toLocaleLowerCase('tr-TR');
    if (/kargo|teslimat|gonder|takip|ne zaman|kac gun/.test(lower)) return 'kargo';
    if (/iade|iptal|geri|degisim|degistir/.test(lower)) return 'iade';
    if (/orijinal|garanti|kalite|urun/.test(lower)) return 'urun';
    if (/fatura|vergi|makbuz/.test(lower)) return 'fatura';
    return 'genel';
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
}
