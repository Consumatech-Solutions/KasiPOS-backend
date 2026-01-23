import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParcelsTable1769080000000 implements MigrationInterface {
  name = 'CreateParcelsTable1769080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE "parcel_status_enum" AS ENUM('Incoming', 'Received', 'Collected')
    `);

    await queryRunner.query(`
      CREATE TABLE "parcels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" integer NOT NULL,
        "delivery_number" character varying NOT NULL,
        "customer_name" character varying NOT NULL,
        "status" "parcel_status_enum" NOT NULL DEFAULT 'Incoming',
        "collection_code" character varying,
        "receipt_code" character varying,
        "date_received" TIMESTAMP,
        "date_collected" TIMESTAMP,
        "collecting_person_name" character varying,
        "collecting_person_phone" character varying,
        "collecting_person_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parcels_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_parcels_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_parcels_store_id" ON "parcels" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parcels_status" ON "parcels" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parcels_delivery_number" ON "parcels" ("delivery_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parcels_collection_code" ON "parcels" ("collection_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parcels_created_at" ON "parcels" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_parcels_created_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_parcels_collection_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_parcels_delivery_number"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_parcels_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_parcels_store_id"`);
    await queryRunner.query(`DROP TABLE "parcels"`);
    await queryRunner.query(`DROP TYPE "parcel_status_enum"`);
  }
}
