import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import {CreateArticleDto} from "./dto/create-article.dto";
import {UpdateArticleDto} from "./dto/update-article.dto";
import {JwtAuthGuard} from "../auth/auth.guard";


@Controller('articles')
export class ArticlesController {
    constructor(private articlesService: ArticlesService) {}

    @Get()
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('authorId') authorId?: string,
        @Query('publishedAfter') publishedAfter?: string,
    ) {
        return this.articlesService.findAll({ page: +page, limit: +limit, authorId, publishedAfter });
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createArticleDto: CreateArticleDto, @Request() req) {
        return this.articlesService.create(createArticleDto, req.user.sub);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto, @Request() req) {
        return this.articlesService.update(id, updateArticleDto, req.user.sub);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Request() req) {
        return this.articlesService.remove(id, req.user.sub);
    }
}
