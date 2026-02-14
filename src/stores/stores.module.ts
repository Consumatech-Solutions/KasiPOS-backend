import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Store]),
        UsersModule,
        AuthModule,
    ],
    controllers: [StoresController],
    providers: [StoresService],
    exports: [StoresService],
})
export class StoresModule {}
