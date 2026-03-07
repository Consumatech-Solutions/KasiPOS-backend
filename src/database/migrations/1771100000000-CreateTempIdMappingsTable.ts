import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create temp_id_mappings table for offline-first temp ID resolution.
 * Stores temp-X -> serverId mappings when products/categories/customers are created.
 */
export class CreateTempIdMappingsTable1771100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "temp_id_mappings" (
        "temp_id" varchar PRIMARY KEY,
        "server_id" uuid NOT NULL,
        "entity_type" varchar NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_temp_id_mappings_temp_id"
      ON "temp_id_mappings" ("temp_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_temp_id_mappings_temp_id"`);
    await queryRunner.query(`DROP TABLE "temp_id_mappings"`);
  }
}
