import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVouchersTable1769050000000 implements MigrationInterface {
  name = 'CreateVouchersTable1769050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for voucher type
    await queryRunner.query(`
      CREATE TYPE "voucher_type_enum" AS ENUM('percentage', 'fixed')
    `);

    await queryRunner.query(`
      CREATE TABLE "vouchers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "type" "voucher_type_enum" NOT NULL,
        "value" numeric(10,2) NOT NULL,
        "min_purchase" numeric(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMP,
        "max_uses" integer,
        "max_uses_per_customer" integer,
        "current_uses" integer NOT NULL DEFAULT 0,
        "customer_usages" jsonb,
        "store_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vouchers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vouchers_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_vouchers_store_code" UNIQUE ("store_id", "code")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_vouchers_store_id" ON "vouchers" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_vouchers_code" ON "vouchers" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_vouchers_is_active" ON "vouchers" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_vouchers_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vouchers_code"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vouchers_store_id"`);
    await queryRunner.query(`DROP TABLE "vouchers"`);
    await queryRunner.query(`DROP TYPE "voucher_type_enum"`);
  }
}
