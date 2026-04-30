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
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialCategoriesService } from "./financial-categories.service";
import { CreateFinancialCategoryDto } from "./dto/create-financial-category.dto";
import { UpdateFinancialCategoryDto } from "./dto/update-financial-category.dto";
import { ListFinancialCategoryDto } from "./dto/list-financial-category.dto";

@Controller("financial-categories")
@UseGuards(JwtAuthGuard)
export class FinancialCategoriesController {
  constructor(private readonly service: FinancialCategoriesService) {}

  @Get()
  findAll(@Req() req: any, @Query() query: ListFinancialCategoryDto) {
    return this.service.findAll(req.user, query);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.service.findOne(req.user, BigInt(id));
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateFinancialCategoryDto) {
    return this.service.create(req.user, body);
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdateFinancialCategoryDto,
  ) {
    return this.service.update(req.user, BigInt(id), body);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user, BigInt(id));
  }
}
