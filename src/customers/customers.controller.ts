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
import { CustomersService } from "./customers.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";

@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Req() req: Request, @Query("q") q?: string) {
    const user = req.user;
    return this.customersService.findAll(user, q);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const user = req.user;
    return this.customersService.findOne(user, BigInt(id));
  }

  @Post()
  create(@Req() req: Request, @Body() body: CreateCustomerDto) {
    const user = req.user;
    return this.customersService.create(user, body);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateCustomerDto
  ) {
    const user = req.user;
    return this.customersService.update(user, BigInt(id), body);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const user = req.user;
    return this.customersService.remove(user, BigInt(id));
  }

  @Get(":id/vehicles")
  vehicles(@Req() req: Request, @Param("id") id: string) {
    const user = req.user;
    return this.customersService.vehiclesOfCustomer(user, id);
  }
}
