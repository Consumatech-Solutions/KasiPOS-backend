import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreAdminResetTokensTable1770960000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_admin_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" varchar(16) NOT NULL UNIQUE,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_store_admin_reset_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_store_admin_reset_tokens_token" ON "store_admin_reset_tokens" ("token");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_store_admin_reset_tokens_expires_at" ON "store_admin_reset_tokens" ("expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_store_admin_reset_tokens_expires_at";`);
    await queryRunner.query(`DROP INDEX "IDX_store_admin_reset_tokens_token";`);
    await queryRunner.query(`DROP TABLE "store_admin_reset_tokens";`);
  }
}
