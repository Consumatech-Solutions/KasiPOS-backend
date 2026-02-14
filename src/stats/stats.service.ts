import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { Client } from '../clients/entities/client.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { MarketplaceOrder } from '../marketplace-orders/entities/marketplace-order.entity';
import { StoreStatus } from '../stores/entities/store.entity';
import { PurchaseOrderStatus } from '../purchase-orders/entities/purchase-order.entity';
import { MarketplaceOrderStatus } from '../marketplace-orders/entities/marketplace-order.entity';
import { GetStatsDto, DateRange } from './dto/get-stats.dto';

export interface StoresStats {
  total: number;
  active: number;
  inactive: number;
}

export interface ClientsStats {
  total: number;
}

export interface TransactionsStats {
  number: number;
  total: number;
}

export interface CampaignsStats {
  total: number;
  active: number;
  inactive: number;
}

export interface PendingActionItem {
  type: string;
  id: string;
  data: Record<string, any>;
}

export interface PendingActionsStats {
  number: number;
  items: PendingActionItem[];
}

export interface AllStatsDto {
  stores: StoresStats;
  clients: ClientsStats;
  transactions: TransactionsStats;
  campaigns: CampaignsStats;
  pendingActions: PendingActionsStats;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(MarketplaceOrder)
    private marketplaceOrdersRepository: Repository<MarketplaceOrder>,
  ) {}

  /**
   * Resolve date range from period or custom startDate/endDate.
   */
  getDateRange(filter?: GetStatsDto): DateRange | null {
    if (!filter) return null;
    const now = new Date();

    if (filter.startDate && filter.endDate) {
      return {
        start: new Date(filter.startDate),
        end: new Date(filter.endDate),
      };
    }

    if (!filter.period) return null;

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (filter.period) {
      case 'today':
        break;
      case 'week': {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        break;
      }
      case 'month':
        start.setDate(1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      default:
        return null;
    }

    return { start, end };
  }

  async getAll(filter?: GetStatsDto): Promise<AllStatsDto> {
    const dateRange = this.getDateRange(filter);

    const [stores, clients, transactions, campaigns, pendingActions] =
      await Promise.all([
        this.getStoresStats(dateRange),
        this.getClientsStats(dateRange),
        this.getTransactionsStats(dateRange),
        this.getCampaignsStats(dateRange),
        this.getPendingActionsStats(dateRange),
      ]);

    return {
      stores,
      clients,
      transactions,
      campaigns,
      pendingActions,
    };
  }

  async getStoresStats(dateRange?: DateRange | null): Promise<StoresStats> {
    const whereBase: any = {};
    if (dateRange) {
      whereBase.createdAt = Between(dateRange.start, dateRange.end);
    }

    const [total, active, inactive] = await Promise.all([
      this.storesRepository.count({ where: whereBase }),
      this.storesRepository.count({
        where: { ...whereBase, status: StoreStatus.ACTIVE },
      }),
      this.storesRepository.count({
        where: { ...whereBase, status: StoreStatus.INACTIVE },
      }),
    ]);
    return { total, active, inactive };
  }

  async getClientsStats(dateRange?: DateRange | null): Promise<ClientsStats> {
    const where: any = {};
    if (dateRange) {
      where.createdAt = Between(dateRange.start, dateRange.end);
    }
    const total = await this.clientsRepository.count({ where });
    return { total };
  }

  async getTransactionsStats(dateRange?: DateRange | null): Promise<TransactionsStats> {
    const qbCount = this.transactionsRepository.createQueryBuilder('t');
    const qbSum = this.transactionsRepository.createQueryBuilder('t').select('COALESCE(SUM(t.total), 0)', 'sum');
    if (dateRange) {
      qbCount.where('t.created_at BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
      qbSum.where('t.created_at BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }
    const [count, result] = await Promise.all([
      qbCount.getCount(),
      qbSum.getRawOne<{ sum: string }>(),
    ]);
    const total = parseFloat(result?.sum ?? '0') || 0;
    return { number: count, total };
  }

  async getCampaignsStats(dateRange?: DateRange | null): Promise<CampaignsStats> {
    const where: any = {};
    if (dateRange) {
      where.createdAt = Between(dateRange.start, dateRange.end);
    }
    const campaigns = await this.campaignsRepository.find({ where });
    const now = new Date();
    let active = 0;
    let inactive = 0;

    for (const c of campaigns) {
      const endDate = this.getCampaignEndDate(c.createdAt, c.duration);
      if (endDate && endDate > now) {
        active++;
      } else {
        inactive++;
      }
    }

    return {
      total: campaigns.length,
      active,
      inactive,
    };
  }

  /**
   * Parse duration string (e.g. "7", "30", "7 days") and add to createdAt.
   */
  private getCampaignEndDate(createdAt: Date, duration: string): Date | null {
    if (!createdAt || !duration) return null;
    const days = parseInt(String(duration).replace(/\D/g, ''), 10);
    if (isNaN(days)) return null;
    const end = new Date(createdAt);
    end.setDate(end.getDate() + days);
    return end;
  }

  async getPendingActionsStats(dateRange?: DateRange | null): Promise<PendingActionsStats> {
    const wherePO: any = { status: PurchaseOrderStatus.PENDING };
    const whereMO: any = { status: MarketplaceOrderStatus.PENDING };
    if (dateRange) {
      wherePO.createdAt = Between(dateRange.start, dateRange.end);
      whereMO.createdAt = Between(dateRange.start, dateRange.end);
    }

    const [purchaseOrders, marketplaceOrders] = await Promise.all([
      this.purchaseOrdersRepository.find({ where: wherePO }),
      this.marketplaceOrdersRepository.find({ where: whereMO }),
    ]);

    const items: PendingActionItem[] = [
      ...purchaseOrders.map((po) => ({
        type: 'purchaseOrder',
        id: po.id,
        data: po as unknown as Record<string, any>,
      })),
      ...marketplaceOrders.map((mo) => ({
        type: 'marketplaceOrder',
        id: mo.id,
        data: mo as unknown as Record<string, any>,
      })),
    ];

    return {
      number: items.length,
      items,
    };
  }
}
