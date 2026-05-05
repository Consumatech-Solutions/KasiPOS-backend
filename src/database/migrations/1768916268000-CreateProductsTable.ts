import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1768916268000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "category_id" uuid NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "cost_price" decimal(10,2) NOT NULL,
                "stock" integer,
                "bar_code" varchar,
                "product_image" varchar,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") 
                    REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_products_name" ON "products" ("name");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_products_category_id" ON "products" ("category_id");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_products_bar_code" ON "products" ("bar_code");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_products_bar_code";`);
    await queryRunner.query(`DROP INDEX "IDX_products_category_id";`);
    await queryRunner.query(`DROP INDEX "IDX_products_name";`);
    await queryRunner.query(`DROP TABLE "products";`);
  }
}
