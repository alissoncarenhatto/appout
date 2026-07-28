import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EstimatesController } from "./estimates.controller";
import { EstimatesService } from "./estimates.service";
import { WorkordersModule } from "../workorders/workorders.module";

@Module({
  imports: [PrismaModule, WorkordersModule],
  controllers: [EstimatesController],
  providers: [EstimatesService],
  exports: [EstimatesService],
})
export class EstimatesModule {}
