import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyToStoreSettings1771170000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "store_settings_currency_enum" AS ENUM('USD', 'CDF', 'ZAR')
    `);

    await queryRunner.query(`
      ALTER TABLE "store_settings"
      ADD COLUMN "currency" "store_settings_currency_enum" NOT NULL DEFAULT 'USD',
      ADD COLUMN "cdf_usd_ex_rate" numeric(18,6),
      ADD COLUMN "zar_usd_ex_rate" numeric(18,6)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "store_settings"
      DROP COLUMN "zar_usd_ex_rate",
      DROP COLUMN "cdf_usd_ex_rate",
      DROP COLUMN "currency"
    `);

    await queryRunner.query(`
      DROP TYPE "store_settings_currency_enum"
    `);
  }
}
