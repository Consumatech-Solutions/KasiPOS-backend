import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace category_id with category_template_id on product_templates.
 * Category templates were created from distinct category names; link by name.
 */
export class ProductTemplatesCategoryTemplateId1771000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      ADD COLUMN "category_template_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "product_templates" pt
      SET "category_template_id" = ct.id
      FROM "categories" c
      JOIN "category_templates" ct ON ct.name = c.name
      WHERE pt."category_id" = c.id
    `);

    await queryRunner.query(`
      ALTER TABLE "product_templates"
      DROP CONSTRAINT IF EXISTS "FK_product_templates_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      DROP COLUMN "category_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "product_templates"
      ADD CONSTRAINT "FK_product_templates_category_template"
      FOREIGN KEY ("category_template_id") REFERENCES "category_templates"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_templates_category_template_id"
      ON "product_templates" ("category_template_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_product_templates_category_template_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      DROP CONSTRAINT IF EXISTS "FK_product_templates_category_template"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      ADD COLUMN "category_id" uuid
    `);
    await queryRunner.query(`
      UPDATE "product_templates" pt
      SET "category_id" = (
        SELECT c.id FROM "categories" c
        JOIN "category_templates" ct ON ct.name = c.name AND ct.id = pt."category_template_id"
        LIMIT 1
      )
      WHERE pt."category_template_id" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      DROP COLUMN "category_template_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      ADD CONSTRAINT "FK_product_templates_category"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);
  }
}
