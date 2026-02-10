import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkordersController } from "./workorders.controller";
import { WorkordersService } from "./workorders.service";
import { WorkorderPdfService } from "./workorder-pdf.service";

@Module({
  imports: [PrismaModule],
  controllers: [WorkordersController],
  providers: [WorkordersService, WorkorderPdfService],
  exports: [WorkordersService, WorkorderPdfService],
})
export class WorkordersModule {}
