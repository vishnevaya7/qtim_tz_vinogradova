import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, name } = createUserDto;

        // Проверяем уникальность email перед созданием, чтобы выбросить понятный ConflictException
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        // Хешируем пароль с солью (10 раундов). Никогда не храним пароли в открытом виде.
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            name,
            password: hashedPassword,
        });

        return await this.userRepository.save(user);
    }

    // Используется в AuthService для проверки учетных данных при логине
    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { email } });
    }

    // Используется JWT-стратегией для валидации пользователя по ID из токена
    async findById(id: number): Promise<User | null> {
        return await this.userRepository.findOne({ where: { id } });
    }
}