import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PaymentMethodsService } from "./payment-methods.service";
import { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "./dto/update-payment-method.dto";
import { ListPaymentMethodDto } from "./dto/list-payment-method.dto";

@Controller("payment-methods")
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  findAll(@Req() req: Request, @Query() query: ListPaymentMethodDto) {
    return this.service.findAll(req.user, query);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne(req.user, BigInt(id));
  }

  @Post()
  create(@Req() req: Request, @Body() body: CreatePaymentMethodDto) {
    return this.service.create(req.user, body);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdatePaymentMethodDto,
  ) {
    return this.service.update(req.user, BigInt(id), body);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.service.remove(req.user, BigInt(id));
  }
}
