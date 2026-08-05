import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
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

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalTrendRange(): {
  startDate: string;
  endDate: string;
  rangeStart: Date;
} {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const rangeStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    0,
    0,
    0,
    0,
  );
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
    rangeStart,
  };
}

function getServerTimezone(): string {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    process.env.TZ ||
    'UTC'
  );
}

function parseDecimal(value: string | number | null | undefined): number {
  return parseFloat(String(value ?? '0')) || 0;
}

type CurrencySumRow = {
  currency: StoreCurrency;
  sum: string | number;
};

type CurrencyTrendRow = {
  date: string;
  currency: StoreCurrency;
  sales: string | number;
};

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly settingsService: SettingsService,
  ) {}

  async getDashboardStats(
    storeId: string,
    query: GetDashboardStatsDto,
  ): Promise<DashboardStatsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { startOfDay, endOfDay } = getLocalDayBounds();
    const { startDate, endDate, rangeStart } = getLocalTrendRange();
    const timezone = getServerTimezone();
    const settings = await this.settingsService.getForStore(storeId);

    const [
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      customersOnCredit,
      recentSales,
      salesTrend,
    ] = await Promise.all([
      this.getTotalSales(storeId, settings),
      this.getTodaySales(storeId, startOfDay, endOfDay, settings),
      this.getTotalCustomers(storeId),
      this.getOutstandingCredits(storeId, settings),
      this.getCustomersOnCredit(storeId, page, limit),
      this.getRecentSales(storeId),
      this.getSalesTrend(
        storeId,
        startDate,
        endDate,
        rangeStart,
        timezone,
        settings,
      ),
    ]);

    return {
      currency: settings.currency,
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      customersOnCredit,
      recentSales,
      salesTrend,
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

  private async getCustomersOnCredit(
    storeId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<string>> {
    const offset = (page - 1) * limit;

    const [countResult, rows] = await Promise.all([
      this.customersRepository
        .createQueryBuilder('c')
        .select('COUNT(*)', 'count')
        .where('c.store_id = :storeId', { storeId })
        .andWhere('c.outstanding_credit > 0')
        .andWhere('c.deleted_at IS NULL')
        .getRawOne<{ count: string }>(),
      this.customersRepository
        .createQueryBuilder('c')
        .select('c.id', 'id')
        .where('c.store_id = :storeId', { storeId })
        .andWhere('c.outstanding_credit > 0')
        .andWhere('c.deleted_at IS NULL')
        .orderBy('c.outstanding_credit', 'DESC')
        .addOrderBy('c.name', 'ASC')
        .offset(offset)
        .limit(limit)
        .getRawMany<{ id: string }>(),
    ]);

    const total = parseInt(countResult?.count ?? '0', 10) || 0;

    return {
      data: rows.map((row) => row.id),
      meta: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private async getRecentSales(storeId: string): Promise<string[]> {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.id', 'id')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.status = :status', { status: TransactionStatus.PAID })
      .orderBy('t.created_at', 'DESC')
      .limit(5)
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }

  private async getSalesTrend(
    storeId: string,
    startDate: string,
    endDate: string,
    rangeStart: Date,
    timezone: string,
    settings: StoreSettings,
  ): Promise<Array<{ date: string; sales: number }>> {
    const rows = await this.transactionsRepository.query(
      `
      WITH days AS (
        SELECT generate_series(
          $2::date,
          $3::date,
          '1 day'
        )::date AS day
      ),
      sales AS (
        SELECT DATE(t.created_at AT TIME ZONE $4) AS day,
               t.currency AS currency,
               COALESCE(SUM(t.total), 0) AS sales
        FROM transactions t
        WHERE t.store_id = $1
          AND t.status = $5
          AND t.created_at >= $6
        GROUP BY 1, 2
      )
      SELECT d.day::text AS date, s.currency AS currency, COALESCE(s.sales, 0) AS sales
      FROM days d
      LEFT JOIN sales s ON s.day = d.day
      ORDER BY d.day
      `,
      [
        storeId,
        startDate,
        endDate,
        timezone,
        TransactionStatus.PAID,
        rangeStart,
      ],
    );

    return this.normalizeTrendRows(rows as CurrencyTrendRow[], settings);
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

  private normalizeTrendRows(
    rows: CurrencyTrendRow[],
    settings: StoreSettings,
  ): Array<{ date: string; sales: number }> {
    const totalsByDate = new Map<string, number>();

    for (const row of rows) {
      const current = totalsByDate.get(row.date) ?? 0;
      const increment = row.currency
        ? this.convertAmount(
            parseDecimal(row.sales),
            row.currency,
            settings.currency,
            settings,
          )
        : 0;
      totalsByDate.set(row.date, current + increment);
    }

    return [...totalsByDate.entries()].map(([date, sales]) => ({
      date,
      sales,
    }));
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
      ((from === StoreCurrency.CDF && to === StoreCurrency.ZAR) &&
        targetCurrency === StoreCurrency.CDF) ||
      ((from === StoreCurrency.ZAR && to === StoreCurrency.CDF) &&
        targetCurrency === StoreCurrency.CDF) ||
      ((from === StoreCurrency.CDF && to === StoreCurrency.ZAR) &&
        targetCurrency === StoreCurrency.ZAR) ||
      ((from === StoreCurrency.ZAR && to === StoreCurrency.CDF) &&
        targetCurrency === StoreCurrency.ZAR);

    if (needed && parsed <= 0) {
      throw new BadRequestException(
        `Exchange rate is not set for ${from}/${to} conversion in store settings.`,
      );
    }

    return parsed;
  }
}
