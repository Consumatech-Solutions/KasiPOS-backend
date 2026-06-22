import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TempIdResolveInterceptor } from '../common/interceptors/temp-id-resolve.interceptor';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ClearCreditDto } from './dto/clear-credit.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { TransactionsService } from './transactions.service';
import { CreateTransactionResult } from './types/create-transaction-result.type';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseInterceptors(TempIdResolveInterceptor)
  @ApiOperation({
    summary: 'Create a transaction (sale)',
    description:
      'If temp customer/product IDs are not yet synced, responds with status "pending" and pendingTransactionId (stored until sync), or status "committed" with the saved transaction. ' +
      'Credit sales require creditDetails.paymentDate, return transaction status pending with creditDueAt, and schedule payment reminder emails. ' +
      'Non-credit sales default to paid; optional status "failed" when payment did not succeed.',
  })
  @ApiResponse({
    status: 201,
    description:
      '{ status: "committed", transaction } or { status: "pending", pendingTransactionId }',
  })
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<CreateTransactionResult> {
    return this.transactionsService.create(dto);
  }

  @Post('clear-credit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mark a pending credit transaction as paid',
    description:
      'Sets transaction status to paid, reduces customer outstanding credit, and cancels pending payment reminders. Store admins are scoped to their store; platform admins may clear any store transaction.',
  })
  @ApiResponse({ status: 201, description: 'Credit cleared successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction state' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async clearCredit(@Body() dto: ClearCreditDto, @Request() req) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const storeId = req.user?.storeId as string | undefined;
    if (!isAdmin && !storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.transactionsService.clearCredit(
      dto.id,
      isAdmin ? undefined : storeId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description:
      'Retrieve a paginated list of transactions with optional filters. Requires authentication.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filter by date (ISO date string, e.g., 2024-01-15)',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID (UUID)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by transaction ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(@Query() query: GetTransactionsDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.transactionsService.findAll(query, storeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description:
      'Retrieve a specific transaction by its ID. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.transactionsService.findOne(id, storeId);
  }
}
