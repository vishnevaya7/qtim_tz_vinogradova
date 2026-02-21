import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAuthDto } from "./dto/create-auth.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Регистрация нового пользователя' })
    @ApiResponse({ status: 201, description: 'Пользователь успешно создан.' })
    @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует.' })
    register(@Body() createAuthDto: CreateAuthDto) {
        // Передаем данные в сервис для обработки логики создания пользователя и хеширования пароля
        return this.authService.register(createAuthDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Авторизация пользователя' })
    @ApiResponse({
        status: 200,
        description: 'Успешный вход. Возвращает JWT токен.',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: { id: 1, email: 'user@example.com', name: 'name' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Неверный email или пароль.' })
    login(@Body() loginDto: LoginDto) {
        // Возвращаем токен и базовую информацию о пользователе для фронтенда
        return this.authService.login(loginDto);
    }
}