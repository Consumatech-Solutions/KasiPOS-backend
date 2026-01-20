import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
        where: { phone: '0812345678' },
    });

    if (existingAdmin) {
        console.log('Admin user already exists');
        return;
    }

    // Create admin user
    const adminUser = userRepository.create({
        phone: '0812345678',
        name: 'System Administrator',
        role: UserRole.ADMIN,
        passwordHash: await bcrypt.hash('Admin@123', 10),
        storeId: 1,
        isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created successfully');
    console.log('   Phone: 0812345678');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
}
