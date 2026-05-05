import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductTemplatesService } from './product-templates.service';
import { CreateProductTemplateDto } from './dto/create-product-template.dto';
import { UpdateProductTemplateDto } from './dto/update-product-template.dto';
import { GetProductTemplatesDto } from './dto/get-product-templates.dto';
import { AssignTemplateToStoreDto } from './dto/assign-template-to-store.dto';
import { AssignTemplateToAllStoresDto } from './dto/assign-template-to-all-stores.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Product Templates')
@Controller('product-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductTemplatesController {
  constructor(
    private readonly productTemplatesService: ProductTemplatesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a product template',
    description:
      'Create a product template. Only name is required; all other fields are optional.',
  })
  @ApiResponse({ status: 201, description: 'Product template created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({
    status: 409,
    description: 'Template with this name already exists',
  })
  async create(@Body() dto: CreateProductTemplateDto) {
    return this.productTemplatesService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'List product templates (admin or store admin)',
    description:
      'Paginated list of product templates with optional search and category template filter.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryTemplateId', required: false, type: String })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Filter templates not yet assigned to this store',
  })
  @ApiQuery({
    name: 'sortByName',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort by template name: asc (A-Z) or desc (Z-A)',
  })
  @ApiResponse({ status: 200, description: 'Product templates retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Store Admin required',
  })
  async findAll(@Query() query: GetProductTemplatesDto) {
    return this.productTemplatesService.findAll(query);
  }

  @Get('for-store')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'List product templates for store (admin or store admin)',
    description:
      "Returns all product templates with category template and brand, for the Add Templates flow. Optionally excludes templates already assigned to the authenticated store admin's store.",
  })
  @ApiResponse({ status: 200, description: 'Product templates retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Store Admin required',
  })
  async findAllForStore(@Request() req: any) {
    const storeId = req.user?.storeId;
    return this.productTemplatesService.findAllForStore(storeId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get a product template by ID (admin or store admin)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Product template retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Store Admin required',
  })
  @ApiResponse({ status: 404, description: 'Product template not found' })
  async findOne(@Param('id') id: string) {
    return this.productTemplatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a product template',
  })
  @ApiParam({ name: 'id', type: String, description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Product template updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'Product template not found' })
  @ApiResponse({
    status: 409,
    description: 'Template with this name already exists',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateProductTemplateDto) {
    return this.productTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a product template',
  })
  @ApiParam({ name: 'id', type: String, description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Product template deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'Product template not found' })
  async remove(@Param('id') id: string) {
    await this.productTemplatesService.remove(id);
    return { message: 'Product template deleted successfully' };
  }

  @Post(':id/assign-store')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign template to a store',
    description:
      'Creates a product from this template for the given store. Request fields (price, stock, etc.) override template values; all are optional except storeId.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Template UUID' })
  @ApiResponse({ status: 201, description: 'Product created for the store.' })
  @ApiResponse({
    status: 400,
    description: 'Category required on template or in request',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'Template or store not found' })
  @ApiResponse({
    status: 409,
    description: 'Product with this name already exists',
  })
  async assignToStore(
    @Param('id') id: string,
    @Body() dto: AssignTemplateToStoreDto,
  ) {
    return this.productTemplatesService.assignToStore(id, dto);
  }

  @Post(':id/assign-all-stores')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign template to all stores',
    description:
      'Creates one product per store from this template, with the same characteristics. Product names are unique per store (template name + store name). Request fields override template values; all are optional.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Template UUID' })
  @ApiResponse({ status: 201, description: 'Products created for all stores.' })
  @ApiResponse({
    status: 400,
    description: 'Category required on template or in request',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async assignToAllStores(
    @Param('id') id: string,
    @Body() dto: AssignTemplateToAllStoresDto,
  ) {
    return this.productTemplatesService.assignToAllStores(id, dto);
  }
}
