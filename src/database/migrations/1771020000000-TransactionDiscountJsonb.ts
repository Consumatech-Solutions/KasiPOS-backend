import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces discount_amount with discount jsonb: { discountType, discountAmount, discountReason }.
 */
export class TransactionDiscountJsonb1771020000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "discount" jsonb
    `);
    // Backfill: existing discount_amount -> discount object
    await queryRunner.query(`
      UPDATE "transactions"
      SET "discount" = jsonb_build_object(
        'discountType', 'amount',
        'discountAmount', "discount_amount",
        'discountReason', ''
      )
      WHERE "discount_amount" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "discount_amount"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "discount_amount" numeric(10,2)
    `);
    await queryRunner.query(`
      UPDATE "transactions"
      SET "discount_amount" = (discount->>'discountAmount')::numeric
      WHERE "discount" IS NOT NULL AND discount->>'discountType' = 'amount'
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "discount"
    `);
  }
}
