import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateArticleDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined) {
            return new Date();
        }
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
        return date;
    })
    published_at?: Date;
}