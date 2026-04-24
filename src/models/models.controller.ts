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
import { ModelsService } from "./models.service";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";

@Controller("models")
export class ModelsController {
  constructor(private readonly service: ModelsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query("brandId") brandId?: string,
    @Query("search") search?: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.service.findAll(req.user, brandId, search, tenantId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne(req.user, id);
  }

  @Post()
  create(@Req() req: Request, @Body() body: CreateModelDto) {
    return this.service.create(req.user, body);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateModelDto,
  ) {
    return this.service.update(req.user, id, body);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.service.remove(req.user, id);
  }
}
