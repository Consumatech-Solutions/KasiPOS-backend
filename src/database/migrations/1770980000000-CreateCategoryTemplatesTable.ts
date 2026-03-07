import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTemplatesTable1770980000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "category_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_templates_name" ON "category_templates" ("name");
    `);
    // Seed from existing categories (distinct names)
    await queryRunner.query(`
      INSERT INTO "category_templates" ("id", "name", "created_at", "updated_at")
      SELECT uuid_generate_v4(), "name", MIN("created_at"), MAX("updated_at")
      FROM "categories"
      GROUP BY "name"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_category_templates_name";`);
    await queryRunner.query(`DROP TABLE "category_templates";`);
  }
}
