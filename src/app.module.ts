import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServicesModule } from './services-catalog/services.module';
import { PartsModule } from './parts/parts.module';
import { WorkordersModule } from './workorders/workorders.module';
import { PaymentsModule } from './payments/payments.module';
import { PdfModule } from './pdf/pdf.module';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,

    UsersModule,
    CustomersModule,
    VehiclesModule,
    ServicesModule,
    PartsModule,
    WorkordersModule,
    PaymentsModule,
    PdfModule,
    BrandsModule,
    ModelsModule,

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
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
