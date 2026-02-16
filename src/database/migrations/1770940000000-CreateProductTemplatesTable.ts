import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTemplatesTable1770940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "category_id" uuid,
        "price" decimal(10,2),
        "cost_price" decimal(10,2),
        "stock" integer,
        "bar_code" varchar,
        "product_image" varchar,
        "low_stock_threshold" integer DEFAULT 0,
        "brand_id" uuid,
        "supplier" varchar,
        "unit_of_measure" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_templates_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_product_templates_brand" FOREIGN KEY ("brand_id")
          REFERENCES "brands"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_templates_name" ON "product_templates" ("name");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_templates_category_id" ON "product_templates" ("category_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_templates_brand_id" ON "product_templates" ("brand_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_templates_bar_code" ON "product_templates" ("bar_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_product_templates_bar_code";`);
    await queryRunner.query(`DROP INDEX "IDX_product_templates_brand_id";`);
    await queryRunner.query(`DROP INDEX "IDX_product_templates_category_id";`);
    await queryRunner.query(`DROP INDEX "IDX_product_templates_name";`);
    await queryRunner.query(`DROP TABLE "product_templates";`);
  }
}
