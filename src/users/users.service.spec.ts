import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

// Улучшенный мок bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
    let service: UsersService;
    let repo: Repository<User>;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User'
    };

    const mockUserRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
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
        const createUserDto = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
        };

        it('должен успешно создать пользователя и захешировать пароль', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const result = await service.create(createUserDto);

            // Проверяем хеширование
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

            // Проверяем, что создается объект с хешем, а не с сырым паролем
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: createUserDto.email,
                name: createUserDto.name,
                password: 'hashedPassword',
            });

            expect(repo.save).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it('должен выбросить ConflictException, если email уже занят', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);

            expect(repo.save).not.toHaveBeenCalled();
        });
    });

    describe('findByEmail', () => {
        it('должен вернуть пользователя по email', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.findByEmail('test@example.com');

            expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(result).toEqual(mockUser);
        });
    });
});