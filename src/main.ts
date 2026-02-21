import {NestFactory, Reflector} from '@nestjs/core';
import { AppModule } from './app.module';
import {ClassSerializerInterceptor, ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Автоматическая валидация входящих DTO и преобразование типов (например, string в number в Query)
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true
    }));

    // Исключаем чувствительные данные (например, пароли) из ответов API на основе декораторов в Entity/DTO
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Настройка Swagger для документации и удобного тестирования эндпоинтов
    const config = new DocumentBuilder()
        .setTitle('Articles API')
        .setDescription('REST API для управления статьями с кэшированием и JWT')
        .setVersion('1.0')
        .addBearerAuth() // Поддержка авторизации через JWT в интерфейсе Swagger
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(3000);
}
bootstrap();