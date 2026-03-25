import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleTransferCompletedStatusOnly1771120000000 implements MigrationInterface {
  name = 'RoleTransferCompletedStatusOnly1771120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "role_transfers"
      SET "status" = 'completed'
      WHERE "status" IN ('pending', 'approved')
    `);

    await queryRunner.query(`
      ALTER TABLE "role_transfers"
      ALTER COLUMN "status" SET DEFAULT 'completed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "role_transfers"
      ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
  }
}
