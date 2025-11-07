import { Module } from '@nestjs/common';
import { WorkordersService } from './workorders.service';
import { WorkordersController } from './workorders.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkordersController],
  providers: [WorkordersService],
  exports: [WorkordersService],
})
export class WorkordersModule {}
