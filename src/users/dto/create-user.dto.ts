import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

   
    @IsEmail()
    email: string;

    @IsEnum(['ADMIN', 'USER',"GUEST"], { message: 'Role must be either ADMIN, USER, or GUEST' })
    role: "ADMIN" | "USER" | "GUEST";
}