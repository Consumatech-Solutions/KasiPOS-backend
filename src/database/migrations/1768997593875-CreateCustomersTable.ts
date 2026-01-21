import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersTable1768997593875 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "customers" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "contact" varchar NOT NULL,
                "loyalty_points" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_customers_name" ON "customers" ("name");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_customers_contact" ON "customers" ("contact");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_customers_contact";`);
    await queryRunner.query(`DROP INDEX "IDX_customers_name";`);
    await queryRunner.query(`DROP TABLE "customers";`);
  }
}
