import { Module } from '@nestjs/common';
import { ServicesCatalogController } from './services.controller';
import { ServicesCatalogService } from './services.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesCatalogController],
  providers: [ServicesCatalogService],
  exports: [ServicesCatalogService],
})
export class ServicesModule {}
