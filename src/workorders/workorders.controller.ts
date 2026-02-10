import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { WorkordersService } from "./workorders.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ScheduleWorkorderDto } from "./dto/schedule-workorder.dto";

@UseGuards(JwtAuthGuard)
@Controller("workorders")
export class WorkordersController {
  constructor(private readonly service: WorkordersService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req.user);
  }

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    return this.service.create(req.user, body);
  }

  @Get(":id(\\d+)")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne(req.user, id);
  }

  @Patch(":id(\\d+)/start")
  start(@Req() req: Request, @Param("id") id: string) {
    return this.service.start(req.user, id);
  }

  @Patch(":id(\\d+)/finish")
  finish(@Req() req: Request, @Param("id") id: string) {
    return this.service.finish(req.user, id);
  }

  @Post(":id(\\d+)/services")
  addService(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.addService(req.user, id, body);
  }

  @Post(":id(\\d+)/parts")
  addPart(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.addPart(req.user, id, body);
  }

  @Get(":id(\\d+)/totals")
  totals(@Req() req: Request, @Param("id") id: string) {
    return this.service.totals(req.user, id);
  }

  @Get("range")
  findByRange(
    @Req() req,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.service.findByRange(req.user, from, to);
  }

  @Post("schedule")
  schedule(@Req() req: any, @Body() dto: ScheduleWorkorderDto) {
    return this.service.schedule(req.user, dto);
  }
}
