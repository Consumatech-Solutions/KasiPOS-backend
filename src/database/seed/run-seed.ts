import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { seedAdminUser } from './admin-user.seed';

async function runSeed() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('📦 Running database seeds...\n');

    await seedAdminUser(dataSource);

    console.log('\n✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
