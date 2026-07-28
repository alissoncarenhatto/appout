import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { CrmService } from "./crm.service";

@Controller("crm")
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get("pipelines")
  listPipelines(@Req() req: Request) {
    return this.service.listPipelines(req.user);
  }

  @Post("pipelines")
  createPipeline(@Req() req: Request, @Body() body: any) {
    return this.service.createPipeline(req.user, body);
  }

  @Post("pipelines/:pipelineId/stages")
  createStage(
    @Req() req: Request,
    @Param("pipelineId") pipelineId: string,
    @Body() body: any,
  ) {
    return this.service.createStage(req.user, pipelineId, body);
  }

  @Get("deals")
  listDeals(@Req() req: Request, @Query() query: any) {
    return this.service.listDeals(req.user, query);
  }

  @Get("campaign-suggestions/inactive-customers")
  inactiveCustomers(@Req() req: Request, @Query() query: any) {
    return this.service.inactiveCustomers(req.user, query);
  }

  @Get("deals/:id")
  findDeal(@Req() req: Request, @Param("id") id: string) {
    return this.service.findDeal(req.user, id);
  }

  @Post("deals")
  createDeal(@Req() req: Request, @Body() body: any) {
    return this.service.createDeal(req.user, body);
  }

  @Patch("deals/:id")
  updateDeal(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.updateDeal(req.user, id, body);
  }

  @Get("activities")
  listActivities(@Req() req: Request, @Query() query: any) {
    return this.service.listActivities(req.user, query);
  }

  @Post("activities")
  createActivity(@Req() req: Request, @Body() body: any) {
    return this.service.createActivity(req.user, body);
  }

  @Get("tasks")
  listTasks(@Req() req: Request, @Query() query: any) {
    return this.service.listTasks(req.user, query);
  }

  @Post("tasks")
  createTask(@Req() req: Request, @Body() body: any) {
    return this.service.createTask(req.user, body);
  }

  @Patch("tasks/:id")
  updateTask(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.updateTask(req.user, id, body);
  }
}
