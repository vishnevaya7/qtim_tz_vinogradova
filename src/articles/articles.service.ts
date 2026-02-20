import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository, MoreThan} from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

interface PaginationOptions {
    page: number;
    limit: number;
    authorId?: number;
    publishedAfter?: string;
}

@Injectable()
export class ArticlesService {
    constructor(
        @InjectRepository(Article)
        private articlesRepository: Repository<Article>,
    ) {}

    async findAll(options: PaginationOptions): Promise<{ items: Article[]; total: number; page: number; limit: number }> {
        const { page, limit, authorId, publishedAfter } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (authorId) where.author_id = authorId;
        if (publishedAfter) where.published_at = MoreThan(new Date(publishedAfter));

        const [items, total] = await this.articlesRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { published_at: 'DESC' },
            relations: ['author'],
        });

        return { items, total, page, limit };
    }

    async findOne(id: number): Promise<Article | null> {
        return this.articlesRepository.findOneBy({ id });
    }

    async create(createArticleDto: CreateArticleDto, authorId: number): Promise<Article> {
        const article = this.articlesRepository.create({ ...createArticleDto, author_id: authorId });
        return this.articlesRepository.save(article);
    }

    async update(id: number, updateArticleDto: UpdateArticleDto, userId: number): Promise<Article> {
        const article = await this.articlesRepository.findOne({
            where: { id },
            relations: ['author']
        });

        if (!article) throw new NotFoundException('Статья не найдена');
        if (article.author_id !== userId) throw new ForbiddenException('Нет прав на редактирование');

        Object.assign(article, updateArticleDto);
        return this.articlesRepository.save(article);
    }

    async remove(id: number, userId: number): Promise<void> {
        const article = await this.articlesRepository.findOne({ where: { id } });
        if (!article) throw new NotFoundException('Статья не найдена');
        if (article.author_id !== userId) throw new ForbiddenException('Нет прав на удаление');

        await this.articlesRepository.delete(id);
    }
}
