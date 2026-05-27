import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1771160000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('credit_payment_reminder')
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "metadata" jsonb,
        "dedupe_key" character varying NOT NULL,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_notifications_user_dedupe"
        ON "notifications" ("user_id", "dedupe_key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_read"
        ON "notifications" ("user_id", "read_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_store_created"
        ON "notifications" ("store_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_store_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_notifications_user_dedupe"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
