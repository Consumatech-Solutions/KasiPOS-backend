import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminFieldsToStoresTable1769110000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create store_status_enum
    await queryRunner.query(`
            CREATE TYPE "store_status_enum" AS ENUM('active', 'inactive');
        `);

    // Add new columns to stores table
    await queryRunner.query(`
            ALTER TABLE "stores"
            ADD COLUMN "client_id" uuid,
            ADD COLUMN "contact_number" varchar,
            ADD COLUMN "initial_status" "store_status_enum",
            ADD COLUMN "address" varchar,
            ADD COLUMN "latitude" varchar,
            ADD COLUMN "longitude" varchar,
            ADD COLUMN "enabled_modules" jsonb DEFAULT '{"groupbuying": false, "marketplace": false, "boph": false, "campaigns": false}',
            ADD COLUMN "trading_hours" jsonb
        `);

    // Add foreign key constraint for client_id
    await queryRunner.query(`
            ALTER TABLE "stores"
            ADD CONSTRAINT "FK_stores_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL
        `);

    // Add index on client_id
    await queryRunner.query(`
            CREATE INDEX "IDX_stores_client_id" ON "stores" ("client_id")
        `);

    // Add index on initial_status
    await queryRunner.query(`
            CREATE INDEX "IDX_stores_initial_status" ON "stores" ("initial_status")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_stores_initial_status";`);
    await queryRunner.query(`DROP INDEX "IDX_stores_client_id";`);

    // Drop foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "stores" DROP CONSTRAINT "FK_stores_client_id"
        `);

    // Drop columns
    await queryRunner.query(`
            ALTER TABLE "stores"
            DROP COLUMN "trading_hours",
            DROP COLUMN "enabled_modules",
            DROP COLUMN "longitude",
            DROP COLUMN "latitude",
            DROP COLUMN "address",
            DROP COLUMN "initial_status",
            DROP COLUMN "contact_number",
            DROP COLUMN "client_id"
        `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "store_status_enum";`);
  }
}
