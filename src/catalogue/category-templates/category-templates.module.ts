import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryTemplate } from './entities/category-template.entity';
import { CategoryTemplatesService } from './category-templates.service';
import { CategoryTemplatesController } from './category-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryTemplate])],
  controllers: [CategoryTemplatesController],
  providers: [CategoryTemplatesService],
  exports: [CategoryTemplatesService],
})
export class CategoryTemplatesModule {}
