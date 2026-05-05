import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1769140000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_action_enum
    await queryRunner.query(`
            CREATE TYPE "audit_action_enum" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER');
        `);

    // Create audit_logs table
    await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "action" "audit_action_enum" NOT NULL DEFAULT 'OTHER',
                "entity" varchar,
                "entity_id" varchar,
                "changes" jsonb,
                "endpoint" varchar,
                "method" varchar,
                "ip_address" varchar,
                "user_agent" varchar,
                "status_code" integer,
                "metadata" jsonb,
                CONSTRAINT "FK_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
            );
        `);

    // Create indexes for common query patterns
    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_entity_id" ON "audit_logs" ("entity_id");
        `);

    // Composite index for entity lookups
    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_entity_entity_id" ON "audit_logs" ("entity", "entity_id");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity_entity_id";`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity_id";`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity";`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_action";`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_user_id";`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_timestamp";`);
    await queryRunner.query(`DROP TABLE "audit_logs";`);
    await queryRunner.query(`DROP TYPE "audit_action_enum";`);
  }
}
