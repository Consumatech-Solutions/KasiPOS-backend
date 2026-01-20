import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1768916267000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_categories_name" ON "categories" ("name");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_categories_name";`);
        await queryRunner.query(`DROP TABLE "categories";`);
    }

}
