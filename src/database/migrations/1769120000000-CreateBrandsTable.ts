import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBrandsTable1769120000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "brands" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "logo_url" varchar,
                "contact_name" varchar,
                "contact_email" varchar,
                "contact_phone" varchar,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_brands_name" ON "brands" ("name");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_brands_name";`);
        await queryRunner.query(`DROP TABLE "brands";`);
    }
}
