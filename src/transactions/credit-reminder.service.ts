import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  CreditPaymentReminder,
  CreditReminderKind,
  CreditReminderStatus,
} from './entities/credit-payment-reminder.entity';
import {
  Transaction,
  TransactionStatus,
} from './entities/transaction.entity';
import { EmailService } from '../services/email.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Customer } from '../customers/entities/customer.entity';

const MILESTONE_OFFSETS_MS: Record<
  Exclude<CreditReminderKind, CreditReminderKind.AT_DUE>,
  number
> = {
  [CreditReminderKind.T48H]: 48 * 60 * 60 * 1000,
  [CreditReminderKind.T24H]: 24 * 60 * 60 * 1000,
  [CreditReminderKind.T12H]: 12 * 60 * 60 * 1000,
  [CreditReminderKind.T1H]: 60 * 60 * 1000,
};

const OVERDUE_INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class CreditReminderService {
  private readonly logger = new Logger(CreditReminderService.name);

  constructor(
    @InjectRepository(CreditPaymentReminder)
    private readonly reminderRepository: Repository<CreditPaymentReminder>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async scheduleReminders(transaction: Transaction): Promise<void> {
    if (
      transaction.paymentMethod !== 'Credit' ||
      !transaction.creditDueAt ||
      transaction.status !== TransactionStatus.PENDING
    ) {
      return;
    }

    const now = new Date();
    const dueAt = new Date(transaction.creditDueAt);
    const kinds = [
      CreditReminderKind.T48H,
      CreditReminderKind.T24H,
      CreditReminderKind.T12H,
      CreditReminderKind.T1H,
      CreditReminderKind.AT_DUE,
    ] as const;

    const rows: CreditPaymentReminder[] = [];

    for (const kind of kinds) {
      let scheduledAt: Date;
      if (kind === CreditReminderKind.AT_DUE) {
        scheduledAt = dueAt;
      } else {
        scheduledAt = new Date(dueAt.getTime() - MILESTONE_OFFSETS_MS[kind]);
      }
      if (scheduledAt < now) {
        scheduledAt = now;
      }
      rows.push(
        this.reminderRepository.create({
          transactionId: transaction.id,
          storeId: transaction.storeId,
          reminderKind: kind,
          scheduledAt,
          status: CreditReminderStatus.PENDING,
        }),
      );
    }

    await this.reminderRepository.save(rows);
    this.logger.log(
      `Scheduled ${rows.length} credit reminders for transaction ${transaction.id}`,
    );
  }

  async cancelRemindersForTransaction(transactionId: string): Promise<void> {
    await this.reminderRepository.update(
      {
        transactionId,
        status: CreditReminderStatus.PENDING,
      },
      { status: CreditReminderStatus.CANCELLED },
    );
  }

  async processDueMilestoneReminders(): Promise<void> {
    const now = new Date();
    const due = await this.reminderRepository.find({
      where: {
        status: CreditReminderStatus.PENDING,
        scheduledAt: LessThanOrEqual(now),
      },
      relations: ['transaction'],
      take: 50,
    });

    for (const reminder of due) {
      const tx = reminder.transaction;
      if (!tx || tx.status !== TransactionStatus.PENDING) {
        await this.reminderRepository.update(reminder.id, {
          status: CreditReminderStatus.CANCELLED,
        });
        continue;
      }
      await this.sendMilestoneReminder(reminder, tx);
    }
  }

  async processOverdueReminders(): Promise<void> {
    const now = new Date();
    const overdueTxs = await this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.payment_method = :pm', { pm: 'Credit' })
      .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
      .andWhere('t.credit_due_at IS NOT NULL')
      .andWhere('t.credit_due_at < :now', { now })
      .andWhere(
        `(t.last_overdue_reminder_at IS NULL OR t.last_overdue_reminder_at <= :threshold)`,
        { threshold: new Date(now.getTime() - OVERDUE_INTERVAL_MS) },
      )
      .take(50)
      .getMany();

    for (const tx of overdueTxs) {
      const delivered = await this.sendOverdueReminder(tx, now);
      if (delivered) {
        tx.lastOverdueReminderAt = now;
        await this.transactionsRepository.save(tx);
      }
    }
  }

  private async sendMilestoneReminder(
    reminder: CreditPaymentReminder,
    tx: Transaction,
  ): Promise<void> {
    const customer = tx.customerId
      ? await this.customersRepository.findOne({
          where: { id: tx.customerId },
        })
      : null;

    const title = this.milestoneSubject(reminder.reminderKind);
    const customerName = customer?.name ?? null;
    const delivered = await this.deliverCreditReminder(
      tx,
      customerName,
      title,
      reminder.reminderKind,
      `credit-reminder:${tx.id}:${reminder.reminderKind}`,
    );

    if (delivered) {
      await this.reminderRepository.update(reminder.id, {
        status: CreditReminderStatus.SENT,
        sentAt: new Date(),
      });
    }
  }

  private async sendOverdueReminder(
    tx: Transaction,
    now: Date,
  ): Promise<boolean> {
    const customer = tx.customerId
      ? await this.customersRepository.findOne({
          where: { id: tx.customerId },
        })
      : null;

    const title = 'Credit payment overdue';
    const overdueWindow = Math.floor(now.getTime() / OVERDUE_INTERVAL_MS);
    return this.deliverCreditReminder(
      tx,
      customer?.name ?? null,
      title,
      'OVERDUE',
      `credit-overdue:${tx.id}:${overdueWindow}`,
      true,
    );
  }

  private async deliverCreditReminder(
    tx: Transaction,
    customerName: string | null,
    title: string,
    reminderKind: string,
    dedupeKeySuffix: string,
    overdue = false,
  ): Promise<boolean> {
    const body = this.buildNotificationBody(tx, customerName, title, overdue);
    const html = this.buildEmailHtml(tx, customerName, title, overdue);

    const inAppCreated =
      await this.notificationsService.createCreditPaymentReminders({
        storeId: tx.storeId,
        transactionId: tx.id,
        title,
        body,
        reminderKind,
        dedupeKeySuffix,
        customerId: tx.customerId,
        customerName,
        total: tx.total,
        creditDueAt: tx.creditDueAt,
        overdue,
      });

    const emailSent = await this.sendEmailsToStoreAdmins(
      tx.storeId,
      title,
      html,
    );

    if (!inAppCreated && !emailSent) {
      this.logger.warn(`No store admin recipients for store ${tx.storeId}`);
    }

    return inAppCreated || emailSent;
  }

  private async sendEmailsToStoreAdmins(
    storeId: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    const emails = await this.usersService.findStoreAdminEmailsByStoreId(
      storeId,
    );
    if (emails.length === 0) {
      return false;
    }

    let anySent = false;
    for (const to of emails) {
      const result = await this.emailService.sendCreditPaymentReminder(
        to,
        subject,
        html,
      );
      if (result.emailSent) anySent = true;
    }
    return anySent;
  }

  private milestoneSubject(kind: CreditReminderKind): string {
    switch (kind) {
      case CreditReminderKind.T48H:
        return 'Credit payment due in 48 hours';
      case CreditReminderKind.T24H:
        return 'Credit payment due in 24 hours';
      case CreditReminderKind.T12H:
        return 'Credit payment due in 12 hours';
      case CreditReminderKind.T1H:
        return 'Credit payment due in 1 hour';
      case CreditReminderKind.AT_DUE:
        return 'Credit payment due now';
      default:
        return 'Credit payment reminder';
    }
  }

  private buildNotificationBody(
    tx: Transaction,
    customerName: string | null,
    headline: string,
    overdue = false,
  ): string {
    const dueStr = tx.creditDueAt
      ? new Date(tx.creditDueAt).toISOString()
      : 'N/A';
    const customer = customerName ?? tx.customerId ?? 'Unknown';
    const prefix = overdue ? 'Overdue: ' : '';
    return `${prefix}${headline}. Customer ${customer}, amount ${tx.total}, due ${dueStr}.`;
  }

  private buildEmailHtml(
    tx: Transaction,
    customerName: string | null,
    headline: string,
    overdue = false,
  ): string {
    const dueStr = tx.creditDueAt
      ? new Date(tx.creditDueAt).toISOString()
      : 'N/A';
    const frontend =
      this.configService.get<string>('FRONTEND_URL')?.split(',')[0]?.trim() ||
      '';
    const linkBlock = frontend
      ? `<p><a href="${frontend}">Open KasiPOS</a></p>`
      : '';

    return `
      <h2>${headline}</h2>
      ${overdue ? '<p><strong>This credit payment is overdue.</strong></p>' : ''}
      <p>Transaction: <strong>${tx.id}</strong></p>
      <p>Customer: <strong>${customerName ?? tx.customerId ?? 'Unknown'}</strong></p>
      <p>Amount: <strong>${tx.total}</strong></p>
      <p>Due at (UTC): <strong>${dueStr}</strong></p>
      ${tx.creditDetails?.note ? `<p>Note: ${tx.creditDetails.note}</p>` : ''}
      ${linkBlock}
    `;
  }
}
