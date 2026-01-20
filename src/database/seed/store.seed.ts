import { DataSource } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';

export async function seedStore(dataSource: DataSource): Promise<void> {
    const storeRepository = dataSource.getRepository(Store);
    const userRepository = dataSource.getRepository(User);

    // Find the admin user to be the owner
    const adminUser = await userRepository.findOne({
        where: { phone: '0812345678' },
    });

    if (!adminUser) {
        console.error('❌ Admin user not found. Cannot seed store.');
        return;
    }

    // Check if store already exists
    const existingStore = await storeRepository.findOne({
        where: { ownerId: adminUser.id },
    });

    if (existingStore) {
        console.log('Store already exists for admin user');
        return;
    }

    // Create store
    const store = storeRepository.create({
        name: 'KasiPOS Demo Store',
        vatNumber: '4000123456',
        isSetupComplete: true,
        ownerId: adminUser.id,
        receiptHeader: 'Welcome to KasiPOS Demo',
        receiptFooter: 'Thank you for your business!',
        logoUrl: 'https://placehold.co/200x200?text=KasiPOS',
    });

    await storeRepository.save(store);
    console.log('✅ Store created successfully');
    console.log(`   Name: ${store.name}`);
    console.log(`   Owner: ${adminUser.name}`);

    // Update user's storeId if needed (though user entity has storeId column, 
    // it's good to keep them in sync if the relationship is bidirectional or loose)
    adminUser.storeId = store.id;
    await userRepository.save(adminUser);
    console.log('✅ Admin user updated with store ID');
}
