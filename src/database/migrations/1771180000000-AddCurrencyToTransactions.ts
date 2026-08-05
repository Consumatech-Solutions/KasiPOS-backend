import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyToTransactions1771180000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transactions_currency_enum" AS ENUM('USD', 'CDF', 'ZAR')
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "currency" "transactions_currency_enum" DEFAULT 'USD'
    `);

    await queryRunner.query(`
      UPDATE "transactions"
      SET "currency" = 'USD'
      WHERE "currency" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "currency" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions" DROP COLUMN "currency"
    `);

    await queryRunner.query(`
      DROP TYPE "transactions_currency_enum"
    `);
  }
}
