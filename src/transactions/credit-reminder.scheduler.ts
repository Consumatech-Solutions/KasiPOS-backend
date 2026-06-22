import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CreditReminderService } from './credit-reminder.service';

@Injectable()
export class CreditReminderScheduler {
  private readonly logger = new Logger(CreditReminderScheduler.name);

  constructor(private readonly creditReminderService: CreditReminderService) {}

  @Cron('*/2 * * * *')
  async handleCreditReminders(): Promise<void> {
    try {
      await this.creditReminderService.processDueMilestoneReminders();
      await this.creditReminderService.processOverdueReminders();
    } catch (err) {
      this.logger.error(
        'Credit reminder cron failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
