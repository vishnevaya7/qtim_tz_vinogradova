import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateArticleDto {
    @ApiProperty({ example: 'Заголовок статьи', description: 'Заголовок статьи' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Описание статьи', description: 'Описание' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: '2000-01-01T00:00:00Z' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    publishedAt?: Date;
}