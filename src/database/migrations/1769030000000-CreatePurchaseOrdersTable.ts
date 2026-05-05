import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrdersTable1769030000000 implements MigrationInterface {
  name = 'CreatePurchaseOrdersTable1769030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "purchase_order_status_enum" AS ENUM('pending', 'completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TYPE "delivery_method_enum" AS ENUM('delivery', 'collection')
    `);

    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_code" character varying NOT NULL UNIQUE,
        "store_id" integer NOT NULL,
        "items" jsonb NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "delivery_fee" numeric(10,2) NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "delivery_method" "delivery_method_enum" NOT NULL,
        "status" "purchase_order_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_orders_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_store_id" ON "purchase_orders" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_order_code" ON "purchase_orders" ("order_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_status" ON "purchase_orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_created_at" ON "purchase_orders" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_purchase_orders_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_purchase_orders_order_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_purchase_orders_store_id"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
    await queryRunner.query(`DROP TYPE "delivery_method_enum"`);
    await queryRunner.query(`DROP TYPE "purchase_order_status_enum"`);
  }
}
