import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreToProductsTable1769150000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add store_id column to products table
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD COLUMN "store_id" integer
        `);

        // Add foreign key constraint for store_id
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL
        `);

        // Add index on store_id
        await queryRunner.query(`
            CREATE INDEX "IDX_products_store_id" ON "products" ("store_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "IDX_products_store_id";`);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "products" DROP CONSTRAINT "FK_products_store_id"
        `);

        // Drop column
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN "store_id"
        `);
    }
}
