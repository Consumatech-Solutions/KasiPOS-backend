import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { StoreAdminResetToken } from './entities/store-admin-reset-token.entity';
import { Store } from '../stores/entities/store.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    PassportModule,
    TypeOrmModule.forFeature([StoreAdminResetToken, Store]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
          },
        } as any; // Type assertion to bypass @nestjs/jwt type issue
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
