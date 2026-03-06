import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';
import otpConfig from './config/otp.config';
import smsConfig from './config/sms.config';
import s3Config from './config/s3.config';
import { AuthModule } from './auth/auth.module';
import { StoreAdminResetToken } from './auth/entities/store-admin-reset-token.entity';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { CatalogueModule } from './catalogue/catalogue.module';
import { Category } from './catalogue/categories/entities/category.entity';
import { CategoryTemplate } from './catalogue/category-templates/entities/category-template.entity';
import { Product } from './catalogue/products/entities/product.entity';
import { ProductTemplate } from './catalogue/product-templates/entities/product-template.entity';
import { FilesModule } from './files/files.module';
import { StoresModule } from './stores/stores.module';
import { Store } from './stores/entities/store.entity';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './customers/entities/customer.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { Transaction } from './transactions/entities/transaction.entity';
import { StockAdjustmentsModule } from './stock-adjustments/stock-adjustments.module';
import { StockAdjustment } from './stock-adjustments/entities/stock-adjustment.entity';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { PurchaseOrder } from './purchase-orders/entities/purchase-order.entity';
import { VouchersModule } from './vouchers/vouchers.module';
import { Voucher } from './vouchers/entities/voucher.entity';
import { MarketplaceOrdersModule } from './marketplace-orders/marketplace-orders.module';
import { MarketplaceOrder } from './marketplace-orders/entities/marketplace-order.entity';
import { MarketplaceStoresModule } from './marketplace-stores/marketplace-stores.module';
import { MarketplaceStore } from './marketplace-stores/entities/marketplace-store.entity';
import { ParcelsModule } from './parcels/parcels.module';
import { Parcel } from './parcels/entities/parcel.entity';
import { ClientsModule } from './clients/clients.module';
import { Client } from './clients/entities/client.entity';
import { BrandsModule } from './brands/brands.module';
import { Brand } from './brands/entities/brand.entity';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './audit-logs/interceptors/audit-log.interceptor';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ServicesModule } from './services/services.module';
import { Campaign } from './campaigns/entities/campaign.entity';
import { StatsModule } from './stats/stats.module';
import { SettingsModule } from './settings/settings.module';
import { StoreSettings } from './settings/entities/store-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, otpConfig, smsConfig, s3Config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('database.url');
        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: configService.get<string>('database.host'),
                port: configService.get<number>('database.port'),
                username: configService.get<string>('database.username'),
                password: configService.get<string>('database.password'),
                database: configService.get<string>('database.database'),
              }),
          entities: [User, Category, CategoryTemplate, Product, ProductTemplate, Store, Customer, Transaction, StockAdjustment, PurchaseOrder, Voucher, MarketplaceOrder, MarketplaceStore, Parcel, Client, Brand, AuditLog, Campaign, StoreAdminResetToken, StoreSettings],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: false, // Always use migrations instead of synchronize
          logging: false, // Disable query logging
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ServicesModule,
    AuthModule,
    UsersModule,
    CatalogueModule,
    FilesModule,
    StoresModule,
    CustomersModule,
    TransactionsModule,
    StockAdjustmentsModule,
    PurchaseOrdersModule,
    VouchersModule,
    MarketplaceOrdersModule,
    MarketplaceStoresModule,
    ParcelsModule,
    ClientsModule,
    BrandsModule,
    AuditLogsModule,
    CampaignsModule,
    StatsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule { }
