import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TaxRatesController } from './tax-rates.controller';
import { DiscountCodesController } from './discount-codes.controller';
import { BillingCatalogService } from './billing-catalog.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [InvoicesModule, NotificationsModule],
  controllers: [PaymentsController, TaxRatesController, DiscountCodesController],
  providers: [PaymentsService, BillingCatalogService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
