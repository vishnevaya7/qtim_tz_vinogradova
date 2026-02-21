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
    const mockArticle = {
        id: 1,
        title: 'Test Title',
        description: 'Test Description',
        authorId: 100,
        publishedAt: new Date(),
    } as unknown as Article;

    const mockRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(), // Сервис вызывает именно clear()
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

    describe('findAll', () => {
        const paginationOptions = { page: 1, limit: 10 };

        it('должен вернуть данные из кэша, если они существуют', async () => {
            const cachedResult = { items: [mockArticle], total: 1, page: 1, limit: 10 };
            mockCache.get.mockResolvedValue(cachedResult);

            const result = await service.findAll(paginationOptions);

            expect(cache.get).toHaveBeenCalled();
            expect(repo.createQueryBuilder).not.toHaveBeenCalled();
            expect(result).toEqual(cachedResult);
        });

        it('должен сделать запрос к БД и записать в кэш, если кэша нет', async () => {
            mockCache.get.mockResolvedValue(null);

            // Настройка сложного мока QueryBuilder
            const queryBuilder: any = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[mockArticle], 1]),
            };
            mockRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findAll(paginationOptions);

            expect(repo.createQueryBuilder).toHaveBeenCalled();
            expect(cache.set).toHaveBeenCalledWith(
                expect.stringContaining('articles_list:'),
                result,
                600000
            );
            expect(result.items).toContain(mockArticle);
        });
    });

    describe('create', () => {
        it('должен создать статью и полностью очистить кэш', async () => {
            const dto = { title: 'New' };
            const userId = 100;

            mockRepo.create.mockReturnValue(mockArticle);
            mockRepo.save.mockResolvedValue(mockArticle);

            const result = await service.create(dto as any, userId);

            expect(repo.create).toHaveBeenCalledWith({ ...dto, authorId: userId });
            expect(cache.clear).toHaveBeenCalled(); // Проверка инвалидации
            expect(result).toEqual(mockArticle);
        });
    });

    describe('update', () => {
        it('должен обновить статью, если пользователь является автором', async () => {
            const updateDto = { title: 'Updated Title' };
            // Мокаем нахождение статьи через findOne
            mockRepo.findOne.mockResolvedValue(mockArticle);
            mockRepo.save.mockResolvedValue({ ...mockArticle, ...updateDto });

            const result = await service.update(1, updateDto as any, 100);

            expect(repo.save).toHaveBeenCalled();
            expect(cache.clear).toHaveBeenCalled();
            expect(result.title).toBe('Updated Title');
        });

        it('должен выбросить ForbiddenException, если редактирует не автор', async () => {
            mockRepo.findOne.mockResolvedValue(mockArticle);

            await expect(
                service.update(1, { title: 'Hack' } as any, 999)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('remove', () => {
        it('должен удалить статью и очистить кэш', async () => {
            mockRepo.findOne.mockResolvedValue(mockArticle);
            mockRepo.remove.mockResolvedValue(mockArticle);

            await service.remove(1, 100);

            expect(repo.remove).toHaveBeenCalledWith(mockArticle);
            expect(cache.clear).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException, если статьи не существует', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.remove(1, 100)).rejects.toThrow(NotFoundException);
        });
    });
});