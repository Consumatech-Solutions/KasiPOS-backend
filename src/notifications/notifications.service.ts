import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  CreditPaymentNotificationMetadata,
} from './entities/notification.entity';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';

export type CreateCreditPaymentNotificationInput = {
  storeId: string;
  transactionId: string;
  title: string;
  body: string;
  reminderKind: string;
  dedupeKeySuffix: string;
  customerId?: string | null;
  customerName?: string | null;
  total: string | number;
  creditDueAt?: Date | null;
  overdue?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly usersService: UsersService,
  ) {}

  async createCreditPaymentReminders(
    input: CreateCreditPaymentNotificationInput,
  ): Promise<boolean> {
    const recipients =
      await this.usersService.findStoreAdminRecipientsByStoreId(input.storeId);
    if (recipients.length === 0) {
      return false;
    }

    const metadata: CreditPaymentNotificationMetadata = {
      transactionId: input.transactionId,
      reminderKind: input.reminderKind,
      customerId: input.customerId ?? null,
      customerName: input.customerName ?? null,
      total: String(input.total),
      creditDueAt: input.creditDueAt
        ? new Date(input.creditDueAt).toISOString()
        : null,
      overdue: input.overdue ?? false,
    };

    const rows = recipients.map((recipient) =>
      this.notificationsRepository.create({
        userId: recipient.userId,
        storeId: input.storeId,
        type: NotificationType.CREDIT_PAYMENT_REMINDER,
        title: input.title,
        body: input.body,
        metadata,
        dedupeKey: `${input.dedupeKeySuffix}:${recipient.userId}`,
      }),
    );

    await this.notificationsRepository
      .createQueryBuilder()
      .insert()
      .into(Notification)
      .values(rows)
      .orIgnore()
      .execute();

    return true;
  }

  async findForUser(
    userId: string,
    storeId: string | null,
    query: GetNotificationsDto,
  ): Promise<PaginationResult<Notification>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.notificationsRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC');

    if (storeId) {
      qb.andWhere('n.store_id = :storeId', { storeId });
    }

    if (query.unreadOnly) {
      qb.andWhere('n.read_at IS NULL');
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async countUnread(userId: string, storeId: string | null): Promise<number> {
    const qb = this.notificationsRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.read_at IS NULL');

    if (storeId) {
      qb.andWhere('n.store_id = :storeId', { storeId });
    }

    return qb.getCount();
  }

  async markAsRead(
    userId: string,
    notificationId: string,
    storeId: string | null,
  ): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (storeId && notification.storeId !== storeId) {
      throw new ForbiddenException('Notification does not belong to your store');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(
    userId: string,
    storeId: string | null,
  ): Promise<{ updated: number }> {
    const qb = this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL');

    if (storeId) {
      qb.andWhere('store_id = :storeId', { storeId });
    }

    const result = await qb.execute();
    return { updated: result.affected ?? 0 };
  }
}
