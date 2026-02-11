import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const adminEmail = 'admin@kasipos.com';
    const adminPhone = '0812345678';

    // Check if admin already exists by email
    let existingAdmin = await userRepository.findOne({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('Admin user already exists');
        return;
    }

    // Backfill: existing admin might have been created with phone only (before email migration)
    const legacyAdmin = await userRepository.findOne({
        where: { phone: adminPhone },
    });
    if (legacyAdmin) {
        legacyAdmin.email = adminEmail;
        await userRepository.save(legacyAdmin);
        console.log('✅ Admin user updated with email');
        console.log('   Email: admin@kasipos.demo');
        return;
    }

    // Create admin user
    const adminUser = userRepository.create({
        email: adminEmail,
        phone: adminPhone,
        name: 'System Administrator',
        role: UserRole.ADMIN,
        passwordHash: await bcrypt.hash('Admin@123', 10),
        storeId: 1,
        isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created successfully');
    console.log('   Email: admin@kasipos.com');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
}
