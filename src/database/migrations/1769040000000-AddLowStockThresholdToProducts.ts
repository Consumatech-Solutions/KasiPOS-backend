import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLowStockThresholdToProducts1769040000000 implements MigrationInterface {
  name = 'AddLowStockThresholdToProducts1769040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "low_stock_threshold" integer DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "low_stock_threshold"
    `);
  }
}
