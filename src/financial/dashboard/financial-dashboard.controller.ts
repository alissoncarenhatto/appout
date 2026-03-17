import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialDashboardService } from "./financial-dashboard.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";

@Controller("financial/dashboard")
@UseGuards(JwtAuthGuard)
export class FinancialDashboardController {
  constructor(private service: FinancialDashboardService) {}

  @Get()
  getDashboard(@Req() req: any, @Query() query: DashboardQueryDto) {
    return this.service.getDashboard(req.user, query);
  }
}
