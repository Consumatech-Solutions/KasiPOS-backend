import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillTransactionCurrencyAndDefaultFx1771190000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Historical transactions were previously backfilled to USD.
    //    Now we align every existing transaction to the store principal currency
    //    so "all transactions till now" are interpreted in the store's configured currency.
    await queryRunner.query(`
      UPDATE "transactions" t
      SET "currency" = ss."currency"::text::transactions_currency_enum
      FROM "store_settings" ss
      WHERE ss."store_id" = t."store_id"
    `);

    // 2) Seed missing FX rates for stores that have any non-USD transactions.
    //    This ensures create-time validation can pass for cross-currency transactions.
    await queryRunner.query(`
      UPDATE "store_settings" ss
      SET "cdf_usd_ex_rate" = 2300
      WHERE (ss."cdf_usd_ex_rate" IS NULL OR ss."cdf_usd_ex_rate" <= 0)
        AND EXISTS (
          SELECT 1
          FROM "transactions" t
          WHERE t."store_id" = ss."store_id"
            AND t."currency" <> 'USD'
        )
    `);

    await queryRunner.query(`
      UPDATE "store_settings" ss
      SET "zar_usd_ex_rate" = 16.4
      WHERE (ss."zar_usd_ex_rate" IS NULL OR ss."zar_usd_ex_rate" <= 0)
        AND EXISTS (
          SELECT 1
          FROM "transactions" t
          WHERE t."store_id" = ss."store_id"
            AND t."currency" <> 'USD'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort rollback (data may be user-modified after this migration).
    await queryRunner.query(`
      UPDATE "transactions"
      SET "currency" = 'USD'
    `);

    await queryRunner.query(`
      UPDATE "store_settings"
      SET "cdf_usd_ex_rate" = NULL
      WHERE "cdf_usd_ex_rate" IN (2300, 2300.0)
    `);

    await queryRunner.query(`
      UPDATE "store_settings"
      SET "zar_usd_ex_rate" = NULL
      WHERE "zar_usd_ex_rate" IN (16.4, 16.40)
    `);
  }
}

