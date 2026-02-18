import {ConflictException, Injectable} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import {Repository} from "typeorm";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,) {}

    // регистрация
    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: {email: createUserDto.email}
        });

        if (existingUser) {
            throw new ConflictException('Пользователь с таким email уже существует')
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return await this.userRepository.save(user);
    }

    // аутентификация, поиск по email
    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({where: {email}});
    }

    // валидация логина
    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({where: {email}});
        if (user && await bcrypt.compare(password, user.password)) {
            const {password, ...result } = user;
            return result as User;
        }
        return null;
    }
}
