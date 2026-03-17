import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { PrismaService } from "../prisma/prisma.service";
import { DashboardController } from "./dasboard.controller";

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
