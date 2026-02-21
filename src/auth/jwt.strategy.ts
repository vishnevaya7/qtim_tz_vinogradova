import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        // Конфигурируем Passport на извлечение Bearer-токена из заголовков
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // Обязательно проверяем срок жизни токена
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    /**
     * Вызывается автоматически после успешной расшифровки JWT.
     * Здесь мы проверяем, существует ли еще пользователь в базе.
     */
    async validate(payload: any) {
        // В payload.sub хранится ID пользователя, который мы зашили при логине
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            // Если пользователь был удален из БД, его токен становится недействительным
            throw new UnauthorizedException('Доступ запрещен');
        }

        // Данные, которые мы возвращаем здесь, попадут в объект Request (req.user)
        return {
            sub: user.id,
            email: user.email
        };
    }
}