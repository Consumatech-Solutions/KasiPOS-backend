import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migrates existing stock_adjustments with reason 'Other' to 'Returns'.
 * Uses text cast to avoid "unsafe use of new value" when migrations run in one transaction.
 */
export class StockAdjustmentOtherToReturns1771070000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stock_adjustments"
      ALTER COLUMN "reason" TYPE text USING "reason"::text
    `);
    await queryRunner.query(`
      UPDATE "stock_adjustments"
      SET "reason" = 'Returns'
      WHERE "reason" = 'Other'
    `);
    await queryRunner.query(`
      ALTER TABLE "stock_adjustments"
      ALTER COLUMN "reason" TYPE "stock_adjustment_reason_enum" USING "reason"::"stock_adjustment_reason_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting would require setting back to 'Other'; no-op for safety
  }
}
