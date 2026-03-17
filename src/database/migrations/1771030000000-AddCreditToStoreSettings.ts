import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditToStoreSettings1771030000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "store_settings"
      ADD COLUMN "credit" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "store_settings" DROP COLUMN "credit"
    `);
  }
}
