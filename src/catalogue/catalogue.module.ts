import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { CategoryTemplatesModule } from './category-templates/category-templates.module';
import { ProductsModule } from './products/products.module';
import { ProductTemplatesModule } from './product-templates/product-templates.module';

@Module({
  imports: [CategoriesModule, CategoryTemplatesModule, ProductsModule, ProductTemplatesModule],
  exports: [CategoriesModule, CategoryTemplatesModule, ProductsModule, ProductTemplatesModule],
})
export class CatalogueModule {}
