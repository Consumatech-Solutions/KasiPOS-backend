import { DataSource } from 'typeorm';
import dataSource from '../data-source';

async function runSeed() {
  const connection = await dataSource.initialize();
  
  try {
    console.log('Running seeds...');
    // Add your seed logic here
    
    console.log('Seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    throw error;
  } finally {
    await connection.destroy();
  }
}

runSeed();
