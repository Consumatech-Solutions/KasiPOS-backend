import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminFieldsToProductsTable1769130000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to products table
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD COLUMN "brand_id" uuid,
            ADD COLUMN "supplier" varchar,
            ADD COLUMN "unit_of_measure" varchar
        `);

        // Add foreign key constraint for brand_id
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_brand_id" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL
        `);

        // Add index on brand_id
        await queryRunner.query(`
            CREATE INDEX "IDX_products_brand_id" ON "products" ("brand_id")
        `);

        // Add index on supplier
        await queryRunner.query(`
            CREATE INDEX "IDX_products_supplier" ON "products" ("supplier")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_products_supplier";`);
        await queryRunner.query(`DROP INDEX "IDX_products_brand_id";`);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "products" DROP CONSTRAINT "FK_products_brand_id"
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN "unit_of_measure",
            DROP COLUMN "supplier",
            DROP COLUMN "brand_id"
        `);
    }
}
