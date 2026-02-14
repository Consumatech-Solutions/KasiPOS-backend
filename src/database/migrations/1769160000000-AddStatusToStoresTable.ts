import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToStoresTable1769160000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "stores"
            ADD COLUMN "status" "store_status_enum" NOT NULL DEFAULT 'active'
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_stores_status" ON "stores" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_stores_status";`);
        await queryRunner.query(`
            ALTER TABLE "stores"
            DROP COLUMN "status"
        `);
    }
}
