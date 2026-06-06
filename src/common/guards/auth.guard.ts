import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/user/user.entity';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token gerekli');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Token bulunamadı');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.oAuthToken')
      .where('user.oAuthToken = :oAuthToken', { oAuthToken: token })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Geçersiz token');
    }

    (request as any).user = user;
    return true;
  }
}
