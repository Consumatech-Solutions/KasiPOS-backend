import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToUsersTable1769090000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "email" varchar UNIQUE
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_users_email" ON "users" ("email")
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "phone" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_email";`);
    await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "email"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "phone" SET NOT NULL
        `);
  }
}
