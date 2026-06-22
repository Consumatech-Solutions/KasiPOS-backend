import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionStatusAndCreditReminders1771150000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'failed', 'paid')
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "status" "transaction_status_enum" NOT NULL DEFAULT 'paid',
      ADD COLUMN "credit_due_at" TIMESTAMPTZ,
      ADD COLUMN "credit_settled_at" TIMESTAMPTZ,
      ADD COLUMN "last_overdue_reminder_at" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE TYPE "credit_reminder_kind_enum" AS ENUM ('T48H', 'T24H', 'T12H', 'T1H', 'AT_DUE')
    `);

    await queryRunner.query(`
      CREATE TYPE "credit_reminder_status_enum" AS ENUM ('pending', 'sent', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "credit_payment_reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "reminder_kind" "credit_reminder_kind_enum" NOT NULL,
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "sent_at" TIMESTAMPTZ,
        "status" "credit_reminder_status_enum" NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_credit_payment_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_credit_payment_reminders_transaction"
          FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_credit_payment_reminders_tx_kind"
          UNIQUE ("transaction_id", "reminder_kind")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_credit_payment_reminders_scheduled"
        ON "credit_payment_reminders" ("status", "scheduled_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_credit_due_pending"
        ON "transactions" ("status", "credit_due_at")
        WHERE "payment_method" = 'Credit'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_credit_due_pending"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_credit_payment_reminders_scheduled"`);
    await queryRunner.query(`DROP TABLE "credit_payment_reminders"`);
    await queryRunner.query(`DROP TYPE "credit_reminder_status_enum"`);
    await queryRunner.query(`DROP TYPE "credit_reminder_kind_enum"`);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "last_overdue_reminder_at",
      DROP COLUMN "credit_settled_at",
      DROP COLUMN "credit_due_at",
      DROP COLUMN "status"
    `);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
  }
}
