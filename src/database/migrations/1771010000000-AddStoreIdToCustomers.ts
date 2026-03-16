import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreIdToCustomers1771010000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN "store_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "FK_customers_store"
      FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_store_id" ON "customers" ("store_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_store_id"`);
    await queryRunner.query(`
      ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "FK_customers_store"
    `);
    await queryRunner.query(`
      ALTER TABLE "customers" DROP COLUMN "store_id"
    `);
  }
}
