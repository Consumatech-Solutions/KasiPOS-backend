import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceStoresTable1769070000000 implements MigrationInterface {
  name = 'CreateMarketplaceStoresTable1769070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "marketplace_stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL UNIQUE,
        "name" character varying NOT NULL,
        "logo_url" character varying,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketplace_stores_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_marketplace_stores_code" ON "marketplace_stores" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_marketplace_stores_is_active" ON "marketplace_stores" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_marketplace_stores_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketplace_stores_code"`);
    await queryRunner.query(`DROP TABLE "marketplace_stores"`);
  }
}
