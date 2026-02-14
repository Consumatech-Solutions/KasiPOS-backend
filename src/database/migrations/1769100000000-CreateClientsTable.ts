import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientsTable1769100000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "client_type_enum" AS ENUM('business', 'individual', 'other');
        `);

        await queryRunner.query(`
            CREATE TABLE "clients" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "type" "client_type_enum" NOT NULL DEFAULT 'individual',
                "id_number" varchar,
                "physical_address" varchar,
                "contact_number" varchar,
                "email" varchar,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clients_name" ON "clients" ("name");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clients_type" ON "clients" ("type");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clients_id_number" ON "clients" ("id_number");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_clients_id_number";`);
        await queryRunner.query(`DROP INDEX "IDX_clients_type";`);
        await queryRunner.query(`DROP INDEX "IDX_clients_name";`);
        await queryRunner.query(`DROP TABLE "clients";`);
        await queryRunner.query(`DROP TYPE "client_type_enum";`);
    }
}
