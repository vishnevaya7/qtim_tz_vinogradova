import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        // Валидация переменных окружения через Joi.
        // Если в .env забудем про пароль или URL редиса — приложение упадет сразу, а не в рантайме.
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().default(5432),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().required(),
                REDIS_URL: Joi.string().uri().required().default('redis://localhost:6379'),
                JWT_SECRET: Joi.string().required(),
            }),
        }),

        // Настройка TypeORM.
        // synchronize: false — строго для прод-лайк среды, чтобы не потерять данные случайным авто-обновлением схемы.
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DB_HOST'),
                port: config.get<number>('DB_PORT'),
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME'),
                schema: config.get<string>('DB_SCHEMA', 'public'),
                autoLoadEntities: true,
                synchronize: false, // Используем миграции вместо авто-генерации таблиц
                logging: config.get('NODE_ENV') === 'development', // Логируем запросы только при разработке
            }),
        }),

        // Интеграция Redis для кэширования.
        // Используем Keyv для поддержки актуальных версий cache-manager (v5+).
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                stores: [
                    createKeyv(config.get<string>('REDIS_URL'))
                ],
            }),
        }),

        // Подключение функциональных модулей системы
        AuthModule,
        UsersModule,
        ArticlesModule,
    ],
})
export class AppModule {}