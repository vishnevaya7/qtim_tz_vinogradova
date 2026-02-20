import {Article} from "./entities/article.entity";

export interface PaginationOptions {
    page: number;
    limit: number;
    authorId?: number;
    publishedAfter?: string;
}

export interface PaginatedArticles {
    items: Article[];
    total: number;
    page: number;
    limit: number;
}