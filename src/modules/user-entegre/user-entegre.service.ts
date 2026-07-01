import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { decrypt, encrypt } from '../../utils/encryption.util';
import { EntegreKanal } from '../entegre-kanal/entegre-kanal.entity';
import { CreateUserEntegreDto } from './dto/create-user-entegre.dto';
import { UpdateUserEntegreDto } from './dto/update-user-entegre.dto';
import { UserEntegre } from './user-entegre.entity';

@Injectable()
export class UserEntegreService {
  constructor(
    @InjectRepository(UserEntegre)
    private readonly userEntegreRepository: Repository<UserEntegre>,
    @InjectRepository(EntegreKanal)
    private readonly entegreKanalRepository: Repository<EntegreKanal>,
  ) {}

  findAll(userId: number) {
    return this.userEntegreRepository.find({
      where: { userId },
      relations: { entegreKanal: true },
      order: { id: 'DESC' },
    });
  }

  async findByName(userId: number, slug: string) {
    return this.userEntegreRepository.findOne({
      where: {
        userId,
        entegreKanal: { slug },
      },
      relations: { entegreKanal: true },
      order: { id: 'DESC' },
    });
  }

  async findSecretByName(userId: number, slug: string) {
    const entegre = await this.userEntegreRepository
      .createQueryBuilder('userEntegre')
      .leftJoinAndSelect('userEntegre.entegreKanal', 'entegreKanal')
      .where('userEntegre.userId = :userId', { userId })
      .andWhere('entegreKanal.slug = :slug', { slug })
      .orderBy('userEntegre.id', 'DESC')
      .select([
        'userEntegre.id',
        'userEntegre.userId',
        'userEntegre.entegreKanalId',
        'userEntegre.status',
        'userEntegre.urunSync',
        'userEntegre.stockSync',
        'userEntegre.soruCevapSync',
        'userEntegre.subscribed_at',
        'userEntegre.expires_at',
        'userEntegre.apiData',
        'userEntegre.apiSettings',
        'userEntegre.createdAt',
        'userEntegre.updatedAt',
        'entegreKanal.id',
        'entegreKanal.name',
        'entegreKanal.slug',
        'entegreKanal.category',
        'entegreKanal.isActive',
      ])
      .getOne();

    if (!entegre) {
      return null;
    }

    if (!entegre.apiData) {
      return { ...entegre, apiData: null };
    }

    const decryptedApiData = decrypt(entegre.apiData);

    try {
      return { ...entegre, apiData: JSON.parse(decryptedApiData) };
    } catch {
      return { ...entegre, apiData: decryptedApiData };
    }
  }

  async findOne(id: number, userId: number) {
    const entegre = await this.userEntegreRepository.findOne({
      where: { id, userId },
      relations: { entegreKanal: true },
    });
    if (!entegre) throw new NotFoundException(`UserEntegre with id ${id} not found`);
    return entegre;
  }

  async create(dto: CreateUserEntegreDto, userId: number) {
    const kanalName = (dto.entegrasyonKanal ?? "").trim().toLowerCase();

    const apiSettings =
      dto.apiSettings && typeof dto.apiSettings === 'object'
        ? dto.apiSettings
        : {};

    const apiData =
      dto.apiData && typeof dto.apiData === 'object' ? dto.apiData : {};

    const kanal = await this.entegreKanalRepository
      .createQueryBuilder('entegreKanal')
      .where('LOWER(TRIM(entegreKanal.name)) = :kanalName', {
        kanalName,
      })
      .getOne();

    if (!kanal) {
      throw new NotFoundException(`EntegreKanal with name ${kanalName} not found`);
    }

    const {
      subscribed_at,
      expires_at,
      entegrasyonKanal: _entegrasyonKanal,
      apiSettings: _apiSettings,
      apiData: _apiData,
      status: _status,
      ...rest
    } = dto;

    const parseDate = (val?: string, field?: string) => {
      if (!val) return null;
      const d = new Date(val);
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException(`${field} gecersiz tarih formatinda`);
      return d;
    };

    const encryptedApiData = encrypt(JSON.stringify(apiData));

    const entegre = this.userEntegreRepository.create({
      ...rest,
      entegreKanalId: kanal.id,
      status: true,
      urunSync: dto.urunSync ?? false,
      stockSync: dto.stockSync ?? false,
      soruCevapSync: dto.soruCevapSync ?? false,
      subscribed_at: parseDate(subscribed_at, 'subscribed_at'),
      expires_at: parseDate(expires_at, 'expires_at'),
      apiData: encryptedApiData,
      apiSettings,
      userId,
    });

    return this.userEntegreRepository.save(entegre);
  }

  async update(id: number, dto: UpdateUserEntegreDto, userId: number) {
    const existing = await this.findOne(id, userId);

    const { subscribed_at, expires_at, apiData, ...rest } = dto;
    Object.assign(existing, rest);

    const parseDate = (val?: string, field?: string) => {
      if (!val) return null;
      const d = new Date(val);
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException(`${field} gecersiz tarih formatinda`);
      return d;
    };

    if (subscribed_at !== undefined)
      existing.subscribed_at = parseDate(subscribed_at, 'subscribed_at');
    if (expires_at !== undefined)
      existing.expires_at = parseDate(expires_at, 'expires_at');

    if (apiData !== undefined) {
      if (typeof apiData !== 'object' || apiData === null) {
        throw new BadRequestException('apiData object formatinda olmalidir');
      }
      existing.apiData = encrypt(JSON.stringify(apiData));
    }

    return this.userEntegreRepository.save(existing);
  }

  async delete(id: number, userId: number) {
    const entegre = await this.findOne(id, userId);
    return this.userEntegreRepository.remove(entegre);
  }
}
