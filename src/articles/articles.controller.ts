import {
    Controller, Get, Post,  Delete, Body, Param, Query,
    UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus, Patch
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { JwtAuthGuard } from "../auth/auth.guard";

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список статей с пагинацией и фильтрами' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (default: 10)' })
    @ApiQuery({ name: 'authorId', required: false, type: Number, description: 'ID автора для фильтрации' })
    @ApiQuery({ name: 'publishedAfter', required: false, type: String, description: 'ISO дата после' })
    @ApiResponse({ status: 200, description: 'Успешное получение списка. Данные могут быть возвращены из кэша Redis.' })
    findAll(
        // Используем ParseIntPipe для Query-параметров, так как из URL они всегда приходят строками
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
        @Query('authorId', new ParseIntPipe({ optional: true })) authorId?: number,
        @Query('publishedAfter') publishedAfter?: string,
    ) {
        return this.articlesService.findAll({ page, limit, authorId, publishedAfter });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить статью по ID' })
    @ApiParam({ name: 'id', description: 'Уникальный идентификатор статьи' })
    @ApiResponse({ status: 200, description: 'Статья найдена.' })
    @ApiResponse({ status: 404, description: 'Статья не найдена.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.articlesService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard) // Защита эндпоинта: создание доступно только авторизованным пользователям
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Создать новую статью' })
    @ApiResponse({ status: 201, description: 'Статья создана. Кэш списков будет автоматически инвалидирован.' })
    create(@Body() dto: CreateArticleDto, @Request() req) {
        // sub — это ID пользователя, извлеченный из JWT-токена в JwtStrategy
        return this.articlesService.create(dto, req.user.sub);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Обновить статью' })
    @ApiResponse({ status: 200, description: 'Статья обновлена автором.' })
    @ApiResponse({ status: 403, description: 'Отказ в доступе: попытка редактирования чужого контента.' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateArticleDto,
        @Request() req
    ) {
        return this.articlesService.update(id, dto, req.user.sub);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT) // Устанавливаем статус 204 для успешного удаления без тела ответа
    @ApiOperation({ summary: 'Удалить статью' })
    @ApiResponse({ status: 204, description: 'Статья успешно удалена.' })
    @ApiResponse({ status: 403, description: 'Запрещено удалять статьи других авторов.' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.articlesService.remove(id, req.user.sub);
    }
}