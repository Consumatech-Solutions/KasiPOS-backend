import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds store_id to categories so every category belongs to a store.
 * Duplicates existing categories for every store so "existing categories stay in all stores".
 */
export class AddStoreToCategoriesAndDuplicateForStores1770990000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add store_id nullable
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN "store_id" uuid
    `);

    // 2. Get all store ids (stores table has id uuid)
    const stores = await queryRunner.query(
      `SELECT id FROM "stores" ORDER BY "created_at" ASC`,
    );
    if (stores.length === 0) {
      // No stores: leave store_id null or fail. Make it nullable for now.
      await queryRunner.query(`
        ALTER TABLE "categories"
        DROP CONSTRAINT IF EXISTS "categories_name_key"
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX "UQ_categories_store_id_name"
        ON "categories" ("store_id", "name")
        WHERE "store_id" IS NOT NULL
      `);
      return;
    }

    const firstStoreId = stores[0].id;

    // 3. Assign all existing categories to the first store
    await queryRunner.query(
      `UPDATE "categories" SET "store_id" = $1`,
      [firstStoreId],
    );

    // 4. For each other store, insert a copy of each category (by name)
    const categoryRows = await queryRunner.query(
      `SELECT id, name, created_at, updated_at FROM "categories" WHERE "store_id" = $1`,
      [firstStoreId],
    );
    for (let i = 1; i < stores.length; i++) {
      const storeId = stores[i].id;
      for (const cat of categoryRows) {
        await queryRunner.query(
          `INSERT INTO "categories" ("id", "name", "store_id", "created_at", "updated_at")
           VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
          [cat.name, storeId, cat.created_at, cat.updated_at],
        );
      }
    }

    // 5. Update products: set category_id to the category in the same store with the same name
    // (Cannot reference update target "p" in FROM/JOIN; use FROM c1, c2 and put p in WHERE.)
    await queryRunner.query(`
      UPDATE "products" p
      SET "category_id" = c2.id
      FROM "categories" c1, "categories" c2
      WHERE p.category_id = c1.id
        AND c2.name = c1.name
        AND c2.store_id = p.store_id
        AND p.store_id IS NOT NULL
    `);

    // 6. Make store_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE "categories"
      ALTER COLUMN "store_id" SET NOT NULL
    `);

    // 7. Add FK
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD CONSTRAINT "FK_categories_store"
      FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
    `);

    // 8. Drop old unique on name, add unique (store_id, name)
    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "categories_name_key"
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_categories_store_id_name"
      ON "categories" ("store_id", "name")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_store_id" ON "categories" ("store_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_store_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_categories_store_id_name";`);
    await queryRunner.query(`
      ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_store"
    `);
    await queryRunner.query(`
      ALTER TABLE "categories" DROP COLUMN "store_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "categories" ADD CONSTRAINT "categories_name_key" UNIQUE ("name")
    `);
  }
}
