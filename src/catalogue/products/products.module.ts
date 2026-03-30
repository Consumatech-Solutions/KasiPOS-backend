import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductTemplate } from '../product-templates/entities/product-template.entity';
import { CategoryTemplate } from '../category-templates/entities/category-template.entity';
import { TransactionsModule } from '../../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Brand,
      Store,
      ProductTemplate,
      CategoryTemplate,
    ]),
    forwardRef(() => TransactionsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
