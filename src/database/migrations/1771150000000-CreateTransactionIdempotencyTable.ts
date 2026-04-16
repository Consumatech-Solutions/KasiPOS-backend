import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionIdempotencyTable1771150000000
  implements MigrationInterface
{
  name = 'CreateTransactionIdempotencyTable1771150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transaction_idempotency" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "idempotency_key" varchar(36) NOT NULL,
        "result_json" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "transaction_idempotency_store_id_idempotency_key_key" UNIQUE ("store_id", "idempotency_key")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_idempotency_store_id"
      ON "transaction_idempotency" ("store_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_idempotency_store_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "transaction_idempotency"`);
  }
}
