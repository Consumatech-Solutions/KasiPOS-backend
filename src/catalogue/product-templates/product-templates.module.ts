import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTemplate } from './entities/product-template.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductTemplatesService } from './product-templates.service';
import { ProductTemplatesController } from './product-templates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductTemplate,
      Product,
      Category,
      Brand,
      Store,
    ]),
  ],
  controllers: [ProductTemplatesController],
  providers: [ProductTemplatesService],
  exports: [ProductTemplatesService],
})
export class ProductTemplatesModule {}
