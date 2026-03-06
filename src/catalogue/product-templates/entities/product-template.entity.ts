import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoryTemplate } from '../../category-templates/entities/category-template.entity';
import { Brand } from '../../../brands/entities/brand.entity';

@Entity('product_templates')
export class ProductTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'category_template_id', nullable: true })
  categoryTemplateId: string | null;

  @ManyToOne(() => CategoryTemplate, { nullable: true })
  @JoinColumn({ name: 'category_template_id' })
  categoryTemplate: CategoryTemplate | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null;

  @Column({ type: 'int', nullable: true })
  stock: number | null;

  @Column({ name: 'bar_code', nullable: true })
  barCode: string | null;

  @Column({ name: 'product_image', nullable: true })
  productImage: string | null;

  @Column({ name: 'low_stock_threshold', type: 'int', nullable: true, default: 0 })
  lowStockThreshold: number | null;

  @Column({ name: 'brand_id', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand | null;

  @Column({ nullable: true })
  supplier: string | null;

  @Column({ name: 'unit_of_measure', nullable: true })
  unitOfMeasure: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
