import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoleTransfersTable1771080000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "role_transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "from_user_id" uuid NOT NULL,
        "to_user_id" uuid NOT NULL,
        "old_store_admin_state" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_transfers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_role_transfers_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_transfers_from_user" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_transfers_to_user" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_role_transfers_store_id" ON "role_transfers" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_role_transfers_status" ON "role_transfers" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_role_transfers_status"`);
    await queryRunner.query(`DROP INDEX "IDX_role_transfers_store_id"`);
    await queryRunner.query(`DROP TABLE "role_transfers"`);
  }
}
