import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockAdjustmentsTable1769020000000 implements MigrationInterface {
  name = 'CreateStockAdjustmentsTable1769020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for stock adjustment reason
    await queryRunner.query(`
      CREATE TYPE "stock_adjustment_reason_enum" AS ENUM(
        'New stock received',
        'Shrinkage',
        'Damages',
        'Expired',
        'Other'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "stock_adjustments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "product_name" character varying NOT NULL,
        "old_stock" integer NOT NULL,
        "new_stock" integer NOT NULL,
        "reason" "stock_adjustment_reason_enum" NOT NULL,
        "note" text,
        "store_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_adjustments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_adjustments_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_adjustments_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_stock_adjustments_product_id" ON "stock_adjustments" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_adjustments_store_id" ON "stock_adjustments" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_adjustments_created_at" ON "stock_adjustments" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_adjustments_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_adjustments_store_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_adjustments_product_id"`);
    await queryRunner.query(`DROP TABLE "stock_adjustments"`);
    await queryRunner.query(`DROP TYPE "stock_adjustment_reason_enum"`);
  }
}
