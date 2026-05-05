import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeStoresIdToUuid1770930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "id_new" uuid DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `UPDATE "stores" SET "id_new" = uuid_generate_v4() WHERE "id_new" IS NULL`,
    );

    const childTables = [
      { table: 'users', fk: null },
      { table: 'products', fk: 'FK_products_store_id' },
      { table: 'parcels', fk: 'FK_parcels_store_id' },
      { table: 'marketplace_orders', fk: 'FK_marketplace_orders_store_id' },
      {
        table: 'vouchers',
        fk: 'FK_vouchers_store_id',
        uniqueConstraint: 'UQ_vouchers_store_code',
      },
      { table: 'transactions', fk: null },
      { table: 'stock_adjustments', fk: 'FK_stock_adjustments_store_id' },
      { table: 'purchase_orders', fk: 'FK_purchase_orders_store_id' },
    ];

    for (const { table, fk, uniqueConstraint } of childTables) {
      const storeIdCol = 'store_id';
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "store_id_new" uuid`,
      );
      await queryRunner.query(
        `UPDATE "${table}" t SET "store_id_new" = s."id_new" FROM "stores" s WHERE s."id" = t."${storeIdCol}"`,
      );
      if (uniqueConstraint) {
        await queryRunner.query(
          `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${uniqueConstraint}"`,
        );
      }
      if (fk) {
        await queryRunner.query(
          `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${fk}"`,
        );
      }
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "${storeIdCol}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "${storeIdCol}" uuid`,
      );
      await queryRunner.query(
        `UPDATE "${table}" SET "${storeIdCol}" = "store_id_new"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "store_id_new"`,
      );
      const notNullTables = [
        'parcels',
        'marketplace_orders',
        'vouchers',
        'transactions',
        'stock_adjustments',
        'purchase_orders',
      ];
      if (notNullTables.includes(table)) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${storeIdCol}" SET NOT NULL`,
        );
      }
      if (uniqueConstraint && table === 'vouchers') {
        await queryRunner.query(
          `ALTER TABLE "vouchers" ADD CONSTRAINT "UQ_vouchers_store_code" UNIQUE ("store_id", "code")`,
        );
      }
    }

    await queryRunner.query(
      `ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "stores_pkey"`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "stores" RENAME COLUMN "id_new" TO "id"`,
    );
    await queryRunner.query(`ALTER TABLE "stores" ADD PRIMARY KEY ("id")`);

    for (const { table, fk } of childTables) {
      if (fk && table !== 'users' && table !== 'transactions') {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${fk}" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      'Down migration not implemented: reverting store id from uuid to int requires data mapping.',
    );
  }
}
