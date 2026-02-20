import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('articles')
export class Article {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    @Column()
    author_id: string;

    @ManyToOne(() => User, user => user.articles)
    @JoinColumn({ name: 'author_id' })
    author: User;
}
