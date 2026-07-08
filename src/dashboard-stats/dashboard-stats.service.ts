import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

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

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
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

    const [
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      customersOnCredit,
      recentSales,
      salesTrend,
    ] = await Promise.all([
      this.getTotalSales(storeId),
      this.getTodaySales(storeId, startOfDay, endOfDay),
      this.getTotalCustomers(storeId),
      this.getOutstandingCredits(storeId),
      this.getCustomersOnCredit(storeId, page, limit),
      this.getRecentSales(storeId),
      this.getSalesTrend(storeId, startDate, endDate, rangeStart, timezone),
    ]);

    return {
      totalSales,
      todaySales,
      totalCustomers,
      outstandingCredits,
      customersOnCredit,
      recentSales,
      salesTrend,
    };
  }

  private async getTotalSales(storeId: string): Promise<number> {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.status = :status', { status: TransactionStatus.PAID })
      .getRawOne<{ sum: string }>();

    return parseDecimal(result?.sum);
  }

  private async getTodaySales(
    storeId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<number> {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.status = :status', { status: TransactionStatus.PAID })
      .andWhere('t.created_at >= :startOfDay', { startOfDay })
      .andWhere('t.created_at < :endOfDay', { endOfDay })
      .getRawOne<{ sum: string }>();

    return parseDecimal(result?.sum);
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

  private async getOutstandingCredits(storeId: string): Promise<number> {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.total), 0)', 'sum')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.payment_method = :paymentMethod', { paymentMethod: 'Credit' })
      .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
      .getRawOne<{ sum: string }>();

    return parseDecimal(result?.sum);
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
               COALESCE(SUM(t.total), 0) AS sales
        FROM transactions t
        WHERE t.store_id = $1
          AND t.status = $5
          AND t.created_at >= $6
        GROUP BY 1
      )
      SELECT d.day::text AS date, COALESCE(s.sales, 0) AS sales
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

    return rows.map((row: { date: string; sales: string | number }) => ({
      date: row.date,
      sales: parseDecimal(row.sales),
    }));
  }
}
