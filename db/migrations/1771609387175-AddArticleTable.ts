import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArticleTable1771609387175 implements MigrationInterface {
    name = 'AddArticleTable1771609387175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "qtim"."articles" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "published_at" TIMESTAMP, "author_id" integer NOT NULL, CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "qtim"."articles" ADD CONSTRAINT "FK_6515da4dff8db423ce4eb841490" FOREIGN KEY ("author_id") REFERENCES "qtim"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qtim"."articles" DROP CONSTRAINT "FK_6515da4dff8db423ce4eb841490"`);
        await queryRunner.query(`DROP TABLE "qtim"."articles"`);
    }

}
