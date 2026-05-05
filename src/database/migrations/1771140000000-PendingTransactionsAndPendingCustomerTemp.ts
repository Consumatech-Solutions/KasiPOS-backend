import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingTransactionsAndPendingCustomerTemp1771140000000 implements MigrationInterface {
  name = 'PendingTransactionsAndPendingCustomerTemp1771140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "pending_customer_temp_id" varchar NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "pending_transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "unresolved_temp_ids" text[] NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pending_transactions_store_id"
      ON "pending_transactions" ("store_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pending_transactions_unresolved_gin"
      ON "pending_transactions" USING GIN ("unresolved_temp_ids")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pending_transactions_unresolved_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pending_transactions_store_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_transactions"`);

    await queryRunner.query(`
      ALTER TABLE "transactions" DROP COLUMN IF EXISTS "pending_customer_temp_id"
    `);
  }
}
