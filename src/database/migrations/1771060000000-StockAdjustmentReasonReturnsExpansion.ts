import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'Returns' and 'Expansion' to stock_adjustment_reason_enum.
 * (UPDATE of 'Other' -> 'Returns' is in the next migration so new enum values are committed first.)
 */
export class StockAdjustmentReasonReturnsExpansion1771060000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "stock_adjustment_reason_enum" ADD VALUE 'Returns'
    `);
    await queryRunner.query(`
      ALTER TYPE "stock_adjustment_reason_enum" ADD VALUE 'Expansion'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values; would require recreating the type
    // No-op for down
  }
}
