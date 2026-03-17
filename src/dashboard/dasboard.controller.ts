import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { DashboardService } from "./dashboard.service";
import { Request } from "express";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  @Roles("SYSTEM_ADMIN", "TENANT_ADMIN")
  getDashboard(
    @Req() req: Request,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.service.getDashboard(req.user, {
      startDate,
      endDate,
    });
  }
}
