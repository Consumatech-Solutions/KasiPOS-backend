import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1769010000000 implements MigrationInterface {
  name = 'CreateTransactionsTable1769010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" integer NOT NULL,
        "customer_id" uuid,
        "items" jsonb NOT NULL,
        "payment_method" character varying NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "voucher_code" character varying,
        "discount_amount" numeric(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_transactions_store_id" ON "transactions" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_customer_id" ON "transactions" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_customer_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_store_id"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
  }
}

