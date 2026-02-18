import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import {LoginDto} from "../users/dto/login.dto";
import {CreateAuthDto} from "./dto/create-auth.dto";


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() createAuthDto: CreateAuthDto) {
        return this.authService.register(createAuthDto);
    }

    @Post('login')
    @HttpCode(200)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
