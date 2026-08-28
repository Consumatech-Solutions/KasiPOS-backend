import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';
import {
  ApproachingDueDateGroupDto,
  CreditListItemDto,
  DashboardStatsResponseDto,
  ProductSalesStatDto,
} from './dto/dashboard-stats-response.dto';
import { SettingsService } from '../settings/settings.service';
import {
  StoreCurrency,
  StoreSettings,
} from '../settings/entities/store-settings.entity';

function getLocalDayBounds(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return { startOfDay, endOfDay };
}

function parseDecimal(value: string | number | null | undefined): number {
  return parseFloat(String(value ?? '0')) || 0;
}

function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

type CurrencySumRow = {
  currency: StoreCurrency;
  sum: string | number;
};

type CreditListRow = {
  id: string;
  clientName: string;
  total: string | number;
  currency: StoreCurrency;
  dueDate: Date | string;
};

type ApproachingCreditRow = {
  id: string;
  customerId: string;
  total: string | number;
  currency: StoreCurrency;
  dueDate: Date | string;
};

type ProductAggRow = {
  productId: string;
  name: string | null;
  unitsSold: string | number;
  revenue: string | number;
  currency: StoreCurrency;
};

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly settingsService: SettingsService,
  ) {}

  async getDashboardStats(
    storeId: string,
    query: GetDashboardStatsDto,
  ): Promise<DashboardStatsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { startOfDay, endOfDay } = getLocalDayBounds();
    const settings = await this.settingsService.getForStore(storeId);

    const [
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      approachingDueDates,
      creditsToRecover,
      overdueCredits,
      lowStockProducts,
      noStockProducts,
      productAggRows,
    ] = await Promise.all([
      this.getTotalSales(storeId, settings),
      this.getTodaySales(storeId, startOfDay, endOfDay, settings),
      this.getTotalCustomers(storeId),
      this.getOutstandingCredits(storeId, settings),
      this.getApproachingDueDates(storeId, settings),
      this.getCreditsList(storeId, page, limit, settings, 'upcoming'),
      this.getCreditsList(storeId, page, limit, settings, 'overdue'),
      this.getLowStockProducts(storeId, page, limit),
      this.getNoStockProducts(storeId, page, limit),
      this.getProductSalesAggregates(storeId),
    ]);

    const productSales = this.normalizeProductSales(productAggRows, settings);
    const mostSoldProducts = [...productSales]
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);
    const mostProfitableProduct =
      productSales.length === 0
        ? null
        : [...productSales].sort(
            (a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold,
          )[0];

    return {
      currency: settings.currency,
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      approachingDueDates,
      creditsToRecover,
      overdueCredits,
      lowStockProducts,
      noStockProducts,
      mostSoldProducts,
      mostProfitableProduct,
    };
  }

  private async getTotalSales(
    storeId: string,
    settings: StoreSettings,
  ): Promise<number> {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.currency', 'currency')
      .addSelect('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.status = :status', { status: TransactionStatus.PAID })
      .groupBy('t.currency')
      .getRawMany<CurrencySumRow>();

    return this.normalizeCurrencyRows(rows, settings);
  }

  private async getTodaySales(
    storeId: string,
    startOfDay: Date,
    endOfDay: Date,
    settings: StoreSettings,
  ): Promise<number> {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.currency', 'currency')
      .addSelect('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.status = :status', { status: TransactionStatus.PAID })
      .andWhere('t.created_at >= :startOfDay', { startOfDay })
      .andWhere('t.created_at < :endOfDay', { endOfDay })
      .groupBy('t.currency')
      .getRawMany<CurrencySumRow>();

    return this.normalizeCurrencyRows(rows, settings);
  }

  private async getTotalCustomers(storeId: string): Promise<number> {
    const result = await this.customersRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .where('c.store_id = :storeId', { storeId })
      .andWhere('c.deleted_at IS NULL')
      .getRawOne<{ count: string }>();

    return parseInt(result?.count ?? '0', 10) || 0;
  }

  private async getOutstandingCredits(
    storeId: string,
    settings: StoreSettings,
  ): Promise<number> {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.currency', 'currency')
      .addSelect('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.payment_method = :paymentMethod', { paymentMethod: 'Credit' })
      .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
      .groupBy('t.currency')
      .getRawMany<CurrencySumRow>();

    return this.normalizeCurrencyRows(rows, settings);
  }

  private async getApproachingDueDates(
    storeId: string,
    settings: StoreSettings,
  ): Promise<ApproachingDueDateGroupDto[]> {
    const dueDateRows: Array<{ dueDate: Date | string }> =
      await this.transactionsRepository.query(
        `
        SELECT t.credit_due_at AS "dueDate"
        FROM transactions t
        WHERE t.store_id = $1
          AND t.payment_method = 'Credit'
          AND t.status = $2
          AND t.credit_due_at IS NOT NULL
          AND t.credit_due_at >= NOW()
        GROUP BY t.credit_due_at
        ORDER BY t.credit_due_at ASC
        LIMIT 2
        `,
        [storeId, TransactionStatus.PENDING],
      );

    if (!dueDateRows.length) {
      return [];
    }

    const dueDates = dueDateRows.map((row) => new Date(row.dueDate));

    const creditRows: ApproachingCreditRow[] =
      await this.transactionsRepository.query(
        `
        SELECT
          t.id AS id,
          t.customer_id AS "customerId",
          t.total AS total,
          t.currency AS currency,
          t.credit_due_at AS "dueDate"
        FROM transactions t
        WHERE t.store_id = $1
          AND t.payment_method = 'Credit'
          AND t.status = $2
          AND t.credit_due_at = ANY($3::timestamptz[])
        ORDER BY t.credit_due_at ASC, t.created_at ASC
        `,
        [storeId, TransactionStatus.PENDING, dueDates],
      );

    const groups = new Map<string, ApproachingDueDateGroupDto>();

    for (const due of dueDates) {
      const key = due.toISOString();
      groups.set(key, {
        dueDate: key,
        credits: [],
        clientsOwingCount: 0,
        totalAmount: 0,
      });
    }

    for (const row of creditRows) {
      const key = new Date(row.dueDate).toISOString();
      const group = groups.get(key);
      if (!group || !row.customerId) {
        continue;
      }

      group.credits.push({ id: row.id, customerId: row.customerId });
      group.totalAmount += this.convertAmount(
        parseDecimal(row.total),
        row.currency,
        settings.currency,
        settings,
      );
    }

    for (const group of groups.values()) {
      group.clientsOwingCount = new Set(
        group.credits.map((c) => c.customerId),
      ).size;
    }

    return dueDates
      .map((d) => groups.get(d.toISOString()))
      .filter((g): g is ApproachingDueDateGroupDto => Boolean(g));
  }

  private async getCreditsList(
    storeId: string,
    page: number,
    limit: number,
    settings: StoreSettings,
    mode: 'upcoming' | 'overdue',
  ): Promise<PaginationResult<CreditListItemDto>> {
    const offset = (page - 1) * limit;
    const duePredicate =
      mode === 'upcoming'
        ? 't.credit_due_at >= NOW()'
        : 't.credit_due_at < NOW()';

    const [countResult, rows] = await Promise.all([
      this.transactionsRepository
        .createQueryBuilder('t')
        .select('COUNT(*)', 'count')
        .where('t.store_id = :storeId', { storeId })
        .andWhere('t.payment_method = :paymentMethod', {
          paymentMethod: 'Credit',
        })
        .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
        .andWhere('t.credit_due_at IS NOT NULL')
        .andWhere(duePredicate)
        .getRawOne<{ count: string }>(),
      this.transactionsRepository
        .createQueryBuilder('t')
        .leftJoin(Customer, 'c', 'c.id = t.customer_id')
        .select('t.id', 'id')
        .addSelect('COALESCE(c.name, \'\')', 'clientName')
        .addSelect('t.total', 'total')
        .addSelect('t.currency', 'currency')
        .addSelect('t.credit_due_at', 'dueDate')
        .where('t.store_id = :storeId', { storeId })
        .andWhere('t.payment_method = :paymentMethod', {
          paymentMethod: 'Credit',
        })
        .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
        .andWhere('t.credit_due_at IS NOT NULL')
        .andWhere(duePredicate)
        .orderBy('t.credit_due_at', 'ASC')
        .addOrderBy('t.created_at', 'ASC')
        .offset(offset)
        .limit(limit)
        .getRawMany<CreditListRow>(),
    ]);

    const total = parseInt(countResult?.count ?? '0', 10) || 0;

    return {
      data: rows.map((row) => ({
        id: row.id,
        clientName: row.clientName,
        totalAmount: this.convertAmount(
          parseDecimal(row.total),
          row.currency,
          settings.currency,
          settings,
        ),
        dueDate: new Date(row.dueDate).toISOString(),
      })),
      meta: paginationMeta(total, page, limit),
    };
  }

  private async getLowStockProducts(
    storeId: string,
    page: number,
    limit: number,
  ): Promise<
    PaginationResult<{
      id: string;
      name: string;
      stock: number;
      lowStockThreshold: number;
    }>
  > {
    const offset = (page - 1) * limit;

    const [countResult, rows] = await Promise.all([
      this.productsRepository
        .createQueryBuilder('p')
        .select('COUNT(*)', 'count')
        .where('p.store_id = :storeId', { storeId })
        .andWhere('p.deleted_at IS NULL')
        .andWhere('p.low_stock_threshold IS NOT NULL')
        .andWhere('p.stock IS NOT NULL')
        .andWhere('p.stock > 0')
        .andWhere('p.stock <= p.low_stock_threshold')
        .getRawOne<{ count: string }>(),
      this.productsRepository
        .createQueryBuilder('p')
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .addSelect('p.stock', 'stock')
        .addSelect('p.low_stock_threshold', 'lowStockThreshold')
        .where('p.store_id = :storeId', { storeId })
        .andWhere('p.deleted_at IS NULL')
        .andWhere('p.low_stock_threshold IS NOT NULL')
        .andWhere('p.stock IS NOT NULL')
        .andWhere('p.stock > 0')
        .andWhere('p.stock <= p.low_stock_threshold')
        .orderBy('p.stock', 'ASC')
        .addOrderBy('p.name', 'ASC')
        .offset(offset)
        .limit(limit)
        .getRawMany<{
          id: string;
          name: string;
          stock: string | number;
          lowStockThreshold: string | number;
        }>(),
    ]);

    const total = parseInt(countResult?.count ?? '0', 10) || 0;

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        stock: parseInt(String(row.stock), 10) || 0,
        lowStockThreshold: parseInt(String(row.lowStockThreshold), 10) || 0,
      })),
      meta: paginationMeta(total, page, limit),
    };
  }

  private async getNoStockProducts(
    storeId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<{ id: string; name: string; stock: number }>> {
    const offset = (page - 1) * limit;

    const [countResult, rows] = await Promise.all([
      this.productsRepository
        .createQueryBuilder('p')
        .select('COUNT(*)', 'count')
        .where('p.store_id = :storeId', { storeId })
        .andWhere('p.deleted_at IS NULL')
        .andWhere('p.stock = 0')
        .getRawOne<{ count: string }>(),
      this.productsRepository
        .createQueryBuilder('p')
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .addSelect('p.stock', 'stock')
        .where('p.store_id = :storeId', { storeId })
        .andWhere('p.deleted_at IS NULL')
        .andWhere('p.stock = 0')
        .orderBy('p.name', 'ASC')
        .offset(offset)
        .limit(limit)
        .getRawMany<{ id: string; name: string; stock: string | number }>(),
    ]);

    const total = parseInt(countResult?.count ?? '0', 10) || 0;

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        stock: parseInt(String(row.stock), 10) || 0,
      })),
      meta: paginationMeta(total, page, limit),
    };
  }

  private async getProductSalesAggregates(
    storeId: string,
  ): Promise<ProductAggRow[]> {
    return this.transactionsRepository.query(
      `
      SELECT
        item->>'productId' AS "productId",
        COALESCE(
          MAX(p.name),
          MAX(NULLIF(item->>'productName', '')),
          ''
        ) AS name,
        t.currency AS currency,
        COALESCE(SUM((item->>'quantity')::numeric), 0) AS "unitsSold",
        COALESCE(SUM((item->>'totalPrice')::numeric), 0) AS revenue
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements(t.items) AS item
      LEFT JOIN products p
        ON p.id::text = item->>'productId'
        AND p.deleted_at IS NULL
      WHERE t.store_id = $1
        AND t.status = $2
        AND item->>'productId' IS NOT NULL
        AND item->>'productId' <> ''
      GROUP BY item->>'productId', t.currency
      `,
      [storeId, TransactionStatus.PAID],
    );
  }

  private normalizeProductSales(
    rows: ProductAggRow[],
    settings: StoreSettings,
  ): ProductSalesStatDto[] {
    const byProduct = new Map<
      string,
      { productId: string; name: string; unitsSold: number; revenue: number }
    >();

    for (const row of rows) {
      if (!row.productId) {
        continue;
      }
      const current = byProduct.get(row.productId) ?? {
        productId: row.productId,
        name: row.name?.trim() || 'Unknown product',
        unitsSold: 0,
        revenue: 0,
      };
      if ((!current.name || current.name === 'Unknown product') && row.name?.trim()) {
        current.name = row.name.trim();
      }
      current.unitsSold += parseDecimal(row.unitsSold);
      current.revenue += this.convertAmount(
        parseDecimal(row.revenue),
        row.currency,
        settings.currency,
        settings,
      );
      byProduct.set(row.productId, current);
    }

    return [...byProduct.values()].map((item) => ({
      productId: item.productId,
      name: item.name,
      unitsSold: Math.round(item.unitsSold),
      revenue: item.revenue,
    }));
  }

  private normalizeCurrencyRows(
    rows: CurrencySumRow[],
    settings: StoreSettings,
  ): number {
    return rows.reduce((sum, row) => {
      if (!row.currency) {
        return sum;
      }
      return (
        sum +
        this.convertAmount(
          parseDecimal(row.sum),
          row.currency,
          settings.currency,
          settings,
        )
      );
    }, 0);
  }

  private convertAmount(
    amount: number,
    from: StoreCurrency,
    to: StoreCurrency,
    settings: StoreSettings,
  ): number {
    if (from === to) {
      return amount;
    }

    const cdfRate = this.requireRate(
      settings.cdfUsdExRate,
      from,
      to,
      StoreCurrency.CDF,
    );
    const zarRate = this.requireRate(
      settings.zarUsdExRate,
      from,
      to,
      StoreCurrency.ZAR,
    );

    if (from === StoreCurrency.USD && to === StoreCurrency.CDF) {
      return amount * cdfRate;
    }
    if (from === StoreCurrency.CDF && to === StoreCurrency.USD) {
      return amount / cdfRate;
    }
    if (from === StoreCurrency.USD && to === StoreCurrency.ZAR) {
      return amount * zarRate;
    }
    if (from === StoreCurrency.ZAR && to === StoreCurrency.USD) {
      return amount / zarRate;
    }
    if (from === StoreCurrency.CDF && to === StoreCurrency.ZAR) {
      return (amount / cdfRate) * zarRate;
    }
    if (from === StoreCurrency.ZAR && to === StoreCurrency.CDF) {
      return (amount / zarRate) * cdfRate;
    }

    return amount;
  }

  private requireRate(
    rate: number | null,
    from: StoreCurrency,
    to: StoreCurrency,
    targetCurrency: StoreCurrency,
  ): number {
    const parsed = Number(rate ?? 0);
    const needed =
      (from === StoreCurrency.USD && to === targetCurrency) ||
      (from === targetCurrency && to === StoreCurrency.USD) ||
      (from === StoreCurrency.CDF &&
        to === StoreCurrency.ZAR &&
        targetCurrency === StoreCurrency.CDF) ||
      (from === StoreCurrency.ZAR &&
        to === StoreCurrency.CDF &&
        targetCurrency === StoreCurrency.CDF) ||
      (from === StoreCurrency.CDF &&
        to === StoreCurrency.ZAR &&
        targetCurrency === StoreCurrency.ZAR) ||
      (from === StoreCurrency.ZAR &&
        to === StoreCurrency.CDF &&
        targetCurrency === StoreCurrency.ZAR);

    if (needed && parsed <= 0) {
      throw new BadRequestException(
        `Exchange rate is not set for ${from}/${to} conversion in store settings.`,
      );
    }

    return parsed;
  }
}
