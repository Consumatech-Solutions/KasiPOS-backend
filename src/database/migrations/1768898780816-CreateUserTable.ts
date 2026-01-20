import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1768898780816 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM('admin', 'staff');
        `);

        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "phone" varchar NOT NULL UNIQUE,
                "name" varchar NOT NULL,
                "password_hash" varchar,
                "role" "user_role_enum" NOT NULL DEFAULT 'staff',
                "store_id" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_phone" ON "users" ("phone");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_store_id" ON "users" ("store_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_store_id";`);
        await queryRunner.query(`DROP INDEX "IDX_users_phone";`);
        await queryRunner.query(`DROP TABLE "users";`);
        await queryRunner.query(`DROP TYPE "user_role_enum";`);
    }

}
