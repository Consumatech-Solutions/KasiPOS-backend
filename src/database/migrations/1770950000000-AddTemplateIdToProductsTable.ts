import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateIdToProductsTable1770950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add template_id column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "template_id" uuid
    `);

    // Add foreign key constraint for template_id
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_template_id" FOREIGN KEY ("template_id") REFERENCES "product_templates"("id") ON DELETE SET NULL
    `);

    // Add index on template_id for query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_products_template_id" ON "products" ("template_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_products_template_id";`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "products" DROP CONSTRAINT "FK_products_template_id"
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "template_id"
    `);
  }
}












