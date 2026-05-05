import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceOrdersTable1769060000000 implements MigrationInterface {
  name = 'CreateMarketplaceOrdersTable1769060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE "marketplace_order_status_enum" AS ENUM('pending', 'completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "marketplace_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_code" character varying NOT NULL UNIQUE,
        "marketplace_store_id" character varying NOT NULL,
        "store_id" integer NOT NULL,
        "customer_id" uuid,
        "items" jsonb NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "vat_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "service_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL,
        "payment_method" character varying NOT NULL,
        "status" "marketplace_order_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketplace_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_marketplace_orders_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_marketplace_orders_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_store_id" ON "marketplace_orders" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_order_code" ON "marketplace_orders" ("order_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_marketplace_store_id" ON "marketplace_orders" ("marketplace_store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_customer_id" ON "marketplace_orders" ("customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_status" ON "marketplace_orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_orders_created_at" ON "marketplace_orders" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_marketplace_store_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_order_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_marketplace_orders_store_id"`,
    );
    await queryRunner.query(`DROP TABLE "marketplace_orders"`);
    await queryRunner.query(`DROP TYPE "marketplace_order_status_enum"`);
  }
}
