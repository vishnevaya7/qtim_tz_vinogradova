import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let repo: Repository<User>;

    const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword', name: 'Test User' };

    const mockUserRepository = {
        findOne: jest.fn(),
        create: jest.fn().mockReturnValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repo = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('должен успешно создать пользователя и захешировать пароль', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const result = await service.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(repo.save).toHaveBeenCalled();
            expect(result.password).toBe('hashedPassword');
        });
    });
    describe('findByEmail', () => {
        it('должен вернуть пользователя, если он найден', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.findByEmail('test@example.com');

            expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(result).toEqual(mockUser);
        });

        it('должен вернуть null, если пользователь не найден', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await service.findByEmail('not-found@example.com');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('должен вернуть пользователя по ID', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.findById(1);

            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(mockUser);
        });

        it('должен вернуть null, если ID не существует', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('create - conflict check', () => {
        it('должен выбросить ConflictException, если email уже занят', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            })).rejects.toThrow(ConflictException);

            expect(repo.save).not.toHaveBeenCalled();
        });
    });
});