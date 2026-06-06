import { Role } from '../user.entity';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    lastname?: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsString()
    token?: string;

    @IsOptional()
    @IsBoolean()
    emailVerified?: boolean;

    @IsOptional()
    @IsString()
    oAuthToken?: string;

    @IsOptional()
    @IsString()
    identityNumber?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}