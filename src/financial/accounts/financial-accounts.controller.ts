import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialAccountsService } from "./financial-accounts.service";
import { ListFinancialAccountDto } from "./dto/list-financial-account.dto";

@Controller("financial-accounts")
@UseGuards(JwtAuthGuard)
export class FinancialAccountsController {
  constructor(private service: FinancialAccountsService) {}

  @Get()
  findAll(@Req() req: any, @Query() query: ListFinancialAccountDto) {
    return this.service.findAll(req.user, query);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.service.findOne(req.user, BigInt(id));
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user, body);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.service.update(req.user, BigInt(id), body);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user, BigInt(id));
  }
}
