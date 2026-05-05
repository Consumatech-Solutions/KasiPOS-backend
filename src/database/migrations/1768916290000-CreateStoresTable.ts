import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateStoresTable1768916290000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stores',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'vat_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'receipt_header',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'receipt_footer',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_setup_complete',
            type: 'boolean',
            default: false,
          },
          {
            name: 'owner_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'stores',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stores');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('owner_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('stores', foreignKey);
    }
    await queryRunner.dropTable('stores');
  }
}
