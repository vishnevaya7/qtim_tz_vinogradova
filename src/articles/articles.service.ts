import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {PaginatedArticles, PaginationOptions} from "./articles.interface";


@Injectable()
export class ArticlesService {
    private readonly CACHE_PREFIX = 'articles_list:';

    constructor(
        @InjectRepository(Article)
        private articlesRepository: Repository<Article>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async findAll(options: PaginationOptions): Promise<PaginatedArticles> {
        const { page, limit, authorId, publishedAfter } = options;

        const cacheKey = `${this.CACHE_PREFIX}p${page}_l${limit}_a${authorId || 'all'}_d${publishedAfter || 'all'}`;

        const cachedData = await this.cacheManager.get<PaginatedArticles>(cacheKey);
        if (cachedData) return cachedData;

        const query = this.articlesRepository.createQueryBuilder('article')
            .leftJoinAndSelect('article.author', 'author')
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('article.published_at', 'DESC');

        if (authorId) query.andWhere('article.author_id = :authorId', { authorId });
        if (publishedAfter) query.andWhere('article.published_at > :publishedAfter', { publishedAfter: new Date(publishedAfter) });

        const [items, total] = await query.getManyAndCount();
        const result = { items, total, page, limit };
        await this.cacheManager.set(cacheKey, result, 600000);

        return result;
    }

    async findOne(id: number): Promise<Article> {
        const article = await this.articlesRepository.findOne({
            where: { id },
            relations: ['author']
        });
        if (!article) throw new NotFoundException(`Статья с ID ${id} не найдена`);
        return article;
    }

    async create(dto: CreateArticleDto, authorId: number): Promise<Article> {
        const article = this.articlesRepository.create({ ...dto, author_id: authorId });
        const saved = await this.articlesRepository.save(article);

        await this.invalidateCache();
        return saved;
    }

    async update(id: number, dto: UpdateArticleDto, userId: number): Promise<Article> {
        const article = await this.findOne(id);
        if (article.author_id !== userId) throw new ForbiddenException('Вы не можете редактировать чужую статью');

        Object.assign(article, dto);
        const updated = await this.articlesRepository.save(article);

        await this.invalidateCache();
        return updated;
    }

    async remove(id: number, userId: number): Promise<void> {
        const article = await this.findOne(id);
        if (article.author_id !== userId) throw new ForbiddenException('Вы не можете удалить чужую статью');

        await this.articlesRepository.remove(article);
        await this.invalidateCache();
    }

    private async invalidateCache() {
            await this.cacheManager.clear();
    }
}