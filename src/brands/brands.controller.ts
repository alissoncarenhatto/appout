import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { BrandsService } from './brands.service';
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query("search") search?: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.brandsService.findAll(req.user, search, tenantId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.brandsService.findOne(req.user, id);
  }

  @Post()
  create(@Req() req: Request, @Body() body: CreateBrandDto) {
    return this.brandsService.create(req.user, body);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateBrandDto,
  ) {
    return this.brandsService.update(req.user, id, body);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.brandsService.remove(req.user, id);
  }
}
