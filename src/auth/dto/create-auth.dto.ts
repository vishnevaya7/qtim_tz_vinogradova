import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'name', description: 'Имя пользователя' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'password', description: 'Пароль (мин. 6 символов)', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;
}