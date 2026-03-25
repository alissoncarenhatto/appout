import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

import { UsersModule } from "./users/users.module";
import { CustomersModule } from "./customers/customers.module";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { ServicesModule } from "./services-catalog/services.module";
import { PartsModule } from "./parts/parts.module";
import { WorkordersModule } from "./workorders/workorders.module";
import { PdfModule } from "./pdf/pdf.module";
import { BrandsModule } from "./brands/brands.module";
import { ModelsModule } from "./models/models.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { TenantsModule } from "./tenants/tenants.module";
import { FinancialModule } from "./financial/financial.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { I18nModule } from "./i18n/i18n.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    I18nModule,

    UsersModule,
    CustomersModule,
    VehiclesModule,
    ServicesModule,
    PartsModule,
    WorkordersModule,
    PdfModule,
    BrandsModule,
    ModelsModule,
    TenantsModule,
    UsersModule,
    FinancialModule,
    DashboardModule,

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
