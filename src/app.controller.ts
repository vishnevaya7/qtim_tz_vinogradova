import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {

    @Get()
    @ApiOperation({
        summary: 'Проверка работоспособности сервиса (Health Check)',
        description: 'Используется для мониторинга доступности API и проверки времени сервера.'
    })
    @ApiResponse({
        status: 200,
        description: 'Сервис работает корректно',
        schema: {
            example: {
                status: 'ok',
                timestamp: '2026-02-20T14:00:00.000Z',
                service: 'Articles API'
            }
        }
    })
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Articles API',
        };
    }
}