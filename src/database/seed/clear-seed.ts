import { DataSource } from 'typeorm';
import dataSource from '../data-source';

async function clearSeed() {
  const connection = await dataSource.initialize();
  
  try {
    console.log('Clearing seeds...');
    // Add your seed clearing logic here
    
    console.log('Seeds cleared successfully!');
  } catch (error) {
    console.error('Error clearing seeds:', error);
    throw error;
  } finally {
    await connection.destroy();
  }
}

clearSeed();
