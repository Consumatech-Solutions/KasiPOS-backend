import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOutstandingCreditToCustomers1771040000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN "outstanding_credit" numeric(10,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers" DROP COLUMN "outstanding_credit"
    `);
  }
}
