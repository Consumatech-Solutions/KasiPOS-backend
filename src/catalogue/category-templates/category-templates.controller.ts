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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoryTemplatesService } from './category-templates.service';
import { CreateCategoryTemplateDto } from './dto/create-category-template.dto';
import { UpdateCategoryTemplateDto } from './dto/update-category-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Category Templates')
@Controller('category-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryTemplatesController {
  constructor(
    private readonly categoryTemplatesService: CategoryTemplatesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a category template (admin)' })
  @ApiResponse({ status: 201, description: 'Category template created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({
    status: 409,
    description: 'Template with this name already exists',
  })
  async create(@Body() dto: CreateCategoryTemplateDto) {
    return this.categoryTemplatesService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_ADMIN)
  @ApiOperation({ summary: 'List category templates (admin or store admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Category templates list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Store Admin required',
  })
  async findAll(@Query() query: PaginationDto) {
    return this.categoryTemplatesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get category template by ID (admin or store admin)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category template' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Store Admin required',
  })
  @ApiResponse({ status: 404, description: 'Category template not found' })
  async findOne(@Param('id') id: string) {
    return this.categoryTemplatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category template (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category template updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Category template not found' })
  @ApiResponse({
    status: 409,
    description: 'Template with this name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryTemplateDto,
  ) {
    return this.categoryTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category template (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category template deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Category template not found' })
  async remove(@Param('id') id: string) {
    await this.categoryTemplatesService.remove(id);
    return { message: 'Category template deleted successfully' };
  }
}
