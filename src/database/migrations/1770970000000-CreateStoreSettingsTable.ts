import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreSettingsTable1770970000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_settings" (
        "store_id" uuid PRIMARY KEY,
        "vat_included_in_price" boolean NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_store_settings_store"
          FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_settings";`);
  }
}
