import {Injectable, UnauthorizedException} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import {UsersService} from "../users/users.service";
import {JwtService} from "@nestjs/jwt";
import {LoginDto} from "../users/dto/login.dto";

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async register(createAuthDto: CreateAuthDto) {
        return this.usersService.create(createAuthDto);
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.validateUser(
            loginDto.email,
            loginDto.password
        );

        if (!user) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name },
        };
    }
}

