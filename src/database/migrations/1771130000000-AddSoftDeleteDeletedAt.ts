import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds soft-delete columns and replaces unique constraints with partial unique indexes
 * where possible. Product names are not given a DB unique index: real data often has
 * duplicates (e.g. same name in different stores), so only a legacy unique constraint
 * is dropped if present.
 */
export class AddSoftDeleteDeletedAt1771130000000 implements MigrationInterface {
  name = 'AddSoftDeleteDeletedAt1771130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'categories',
      'products',
      'product_templates',
      'category_templates',
      'stores',
      'customers',
      'vouchers',
      'parcels',
      'clients',
      'campaigns',
      'brands',
      'marketplace_stores',
      'users',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL
      `);
    }

    // categories: unique (store_id, name) -> partial
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_categories_store_id_name"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_categories_store_id_name"
      ON "categories" ("store_id", "name")
      WHERE "deleted_at" IS NULL
    `);

    // products: drop legacy unique on name if present. Do not add a partial unique index
    // here — many databases already have duplicate product names across stores/rows.
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_name_key"`,
    );

    // product_templates
    await queryRunner.query(
      `ALTER TABLE "product_templates" DROP CONSTRAINT IF EXISTS "product_templates_name_key"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_product_templates_name"
      ON "product_templates" ("name")
      WHERE "deleted_at" IS NULL
    `);

    // category_templates
    await queryRunner.query(
      `ALTER TABLE "category_templates" DROP CONSTRAINT IF EXISTS "category_templates_name_key"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_category_templates_name"
      ON "category_templates" ("name")
      WHERE "deleted_at" IS NULL
    `);

    // vouchers: (store_id, code)
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "UQ_vouchers_store_code"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vouchers_store_code"
      ON "vouchers" ("store_id", "code")
      WHERE "deleted_at" IS NULL
    `);

    // users: phone and email
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_phone_active"
      ON "users" ("phone")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_email_active"
      ON "users" ("email")
      WHERE "deleted_at" IS NULL
    `);

    // marketplace_stores.code
    await queryRunner.query(
      `ALTER TABLE "marketplace_stores" DROP CONSTRAINT IF EXISTS "marketplace_stores_code_key"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_marketplace_stores_code"
      ON "marketplace_stores" ("code")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_marketplace_stores_code"`,
    );
    await queryRunner.query(`
      ALTER TABLE "marketplace_stores"
      ADD CONSTRAINT "marketplace_stores_code_key" UNIQUE ("code")
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_phone_active"`);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone")
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_vouchers_store_code"`);
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "UQ_vouchers_store_code" UNIQUE ("store_id", "code")
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_category_templates_name"`,
    );
    await queryRunner.query(`
      ALTER TABLE "category_templates"
      ADD CONSTRAINT "category_templates_name_key" UNIQUE ("name")
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_product_templates_name"`);
    await queryRunner.query(`
      ALTER TABLE "product_templates"
      ADD CONSTRAINT "product_templates_name_key" UNIQUE ("name")
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_categories_store_id_name"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_categories_store_id_name"
      ON "categories" ("store_id", "name")
    `);

    const tables = [
      'users',
      'marketplace_stores',
      'brands',
      'campaigns',
      'clients',
      'parcels',
      'vouchers',
      'customers',
      'stores',
      'category_templates',
      'product_templates',
      'products',
      'categories',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}" DROP COLUMN IF EXISTS "deleted_at"
      `);
    }
  }
}
