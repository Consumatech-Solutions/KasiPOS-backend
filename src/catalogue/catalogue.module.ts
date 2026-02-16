import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ProductTemplatesModule } from './product-templates/product-templates.module';

@Module({
  imports: [CategoriesModule, ProductsModule, ProductTemplatesModule],
  exports: [CategoriesModule, ProductsModule, ProductTemplatesModule],
})
export class CatalogueModule {}
