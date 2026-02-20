import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';

describe('ArticlesService', () => {
    let service: ArticlesService;
    let repo: Repository<Article>;
    let cache: any;

    // Мок данных
    const mockArticle = { id: 1, title: 'Test', author_id: 100 } as Article;

    // Мок репозитория
    const mockRepo = {
        create: jest.fn().mockReturnValue(mockArticle),
        save: jest.fn().mockResolvedValue(mockArticle),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[mockArticle], 1]),
        })),
    };

    // Мок кэша
    const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        store: {
            keys: jest.fn().mockResolvedValue(['articles_list:1']),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticlesService,
                { provide: getRepositoryToken(Article), useValue: mockRepo },
                { provide: CACHE_MANAGER, useValue: mockCache },
            ],
        }).compile();

        service = module.get<ArticlesService>(ArticlesService);
        repo = module.get<Repository<Article>>(getRepositoryToken(Article));
        cache = module.get(CACHE_MANAGER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('должен создать статью и очистить кэш', async () => {
            const dto = { title: 'New Article' } as any;
            const result = await service.create(dto, 100);

            expect(repo.create).toHaveBeenCalled();
            expect(repo.save).toHaveBeenCalled();
            expect(cache.store.keys).toHaveBeenCalled();
            expect(cache.del).toHaveBeenCalled();
            expect(result).toEqual(mockArticle);
        });
    });

    describe('update', () => {
        it('должен обновить статью, если пользователь — автор', async () => {
            jest.spyOn(service, 'findOne').mockResolvedValue(mockArticle);

            await service.update(1, { title: 'Updated' } as any, 100);

            expect(repo.save).toHaveBeenCalled();
            expect(cache.del).toHaveBeenCalled();
        });

        it('должен кинуть ForbiddenException, если обновляет не автор', async () => {
            jest.spyOn(service, 'findOne').mockResolvedValue(mockArticle);

            await expect(
                service.update(1, { title: 'Updated' } as any, 999),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('findAll (Cache Aside)', () => {
        it('должен вернуть данные из кэша, если они там есть', async () => {
            mockCache.get.mockResolvedValue({ items: [], total: 0 });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(cache.get).toHaveBeenCalled();
            expect(repo.createQueryBuilder).not.toHaveBeenCalled();
            expect(result).toHaveProperty('total');
        });

        it('должен идти в БД и сохранять в кэш, если кэш пуст', async () => {
            mockCache.get.mockResolvedValue(null);

            await service.findAll({ page: 1, limit: 10 });

            expect(repo.createQueryBuilder).toHaveBeenCalled();
            expect(cache.set).toHaveBeenCalledWith(
                expect.stringContaining('articles_list:'),
                expect.any(Object),
                600000
            );
        });
    });
});