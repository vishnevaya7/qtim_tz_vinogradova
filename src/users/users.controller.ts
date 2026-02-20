import {
    Controller,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
//     TODO не нужно по ТЗ, но здесь могут быть нужные АПИ, пока оставила
}