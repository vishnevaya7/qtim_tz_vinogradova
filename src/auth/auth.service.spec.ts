import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

// Мокаем bcrypt один раз для всего файла
jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock_token'),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        const loginDto = { email: 'test@example.com', password: 'password123' };

        it('should return access_token and user data when credentials are valid', async () => {
            // Используем spyOn для более чистой типизации
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(loginDto);

            // Проверяем, что в JWT попал правильный payload (sub и email)
            expect(jwtService.sign).toHaveBeenCalledWith({
                email: mockUser.email,
                sub: mockUser.id,
            });

            expect(result).toEqual({
                access_token: 'mock_token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                },
            });
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                new UnauthorizedException('Неверный email или пароль'),
            );
        });

        it('should throw UnauthorizedException if password does not match', async () => {
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should call usersService.create with correct data', async () => {
            const dto = { email: 'new@test.com', password: '123', name: 'New User' };

            await service.register(dto);

            expect(usersService.create).toHaveBeenCalledWith(dto);
        });
    });
});