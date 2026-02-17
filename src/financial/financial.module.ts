import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FinancialAccountsController } from "./accounts/financial-accounts.controller";
import { FinancialEntriesController } from "./entry/financial-entries.controller";
import { FinancialAccountsService } from "./accounts/financial-accounts.service";
import { FinancialEntriesService } from "./entry/financial-entries.service";
import { PaymentMethodsController } from "./payment-methods/payment-methods.controller";
import { PaymentMethodsService } from "./payment-methods/payment-methods.service";

@Module({
  controllers: [
    FinancialAccountsController,
    FinancialEntriesController,
    PaymentMethodsController,
  ],
  providers: [
    FinancialAccountsService,
    FinancialEntriesService,
    PaymentMethodsService,
    PrismaService,
  ],
})
export class FinancialModule {}
