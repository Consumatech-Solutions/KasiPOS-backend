import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditDetailsToTransactions1771050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "credit_details" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions" DROP COLUMN "credit_details"
    `);
  }
}
