import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { PartsService } from "./parts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePartDto } from "./dto/create-part.dto";
import { UpdatePartDto } from "./dto/update-part.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";

@Controller("parts")
@UseGuards(JwtAuthGuard)
export class PartsController {
  constructor(private service: PartsService) {}

  @Get()
  list(@Req() req: Request) {
    return this.service.list(req.user);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreatePartDto) {
    return this.service.create(req.user, dto);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdatePartDto
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Patch(":id/stock")
  adjustStock(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdjustStockDto
  ) {
    return this.service.adjustStock(req.user, id, dto.delta);
  }
}
