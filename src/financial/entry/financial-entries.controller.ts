import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialEntriesService } from "./financial-entries.service";

@Controller("financial-entries")
@UseGuards(JwtAuthGuard)
export class FinancialEntriesController {
  constructor(private service: FinancialEntriesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user, body);
  }

  @Patch(":id/pay")
  pay(@Req() req: any, @Param("id") id: string) {
    return this.service.markAsPaid(req.user, BigInt(id));
  }
}
