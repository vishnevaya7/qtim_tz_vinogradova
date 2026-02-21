import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { CreateAuthDto } from "./dto/create-auth.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    // Делегируем создание пользователя сервису Users, сохраняя единственную ответственность модулей
    async register(dto: CreateAuthDto) {
        return this.usersService.create(dto);
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Ищем пользователя по email. Если не найден — сразу выдаем 401.
        const user = await this.usersService.findByEmail(email);

        // Сравниваем пришедший пароль с хешем из БД.
        // Используем bcrypt.compare для защиты от атак по времени.
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        // Формируем полезную нагрузку (payload) для JWT.
        // sub (subject) — это стандартное поле для ID пользователя.
        const payload = { email: user.email, sub: user.id };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
        };
    }
}