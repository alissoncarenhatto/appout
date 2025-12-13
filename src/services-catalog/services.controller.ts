import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { ServicesCatalogService } from "./services.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Controller("services-catalog")
@UseGuards(JwtAuthGuard)
export class ServicesCatalogController {
  constructor(private readonly services: ServicesCatalogService) {}

  @Get()
  list(@Req() req: Request) {
    return this.services.list(req.user);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.services.findOne(req.user, id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateServiceDto) {
    return this.services.create(req.user, dto);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto
  ) {
    return this.services.update(req.user, id, dto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.services.remove(req.user, id);
  }
}
