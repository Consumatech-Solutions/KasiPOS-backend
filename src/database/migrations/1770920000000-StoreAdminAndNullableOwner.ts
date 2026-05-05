import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreAdminAndNullableOwner1770920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'store_admin';
    `);
    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "owner_id" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores" ALTER COLUMN "owner_id" SET NOT NULL;
    `);
  }
}
