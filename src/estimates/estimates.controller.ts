import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { EstimatesService } from "./estimates.service";

@Controller("estimates")
export class EstimatesController {
  constructor(private readonly service: EstimatesService) {}

  @Get()
  list(@Req() req: Request, @Query() query: any) {
    return this.service.list(req.user, query);
  }

  @Get("campaign-suggestions/pending")
  pendingCampaign(@Req() req: Request, @Query() query: any) {
    return this.service.pendingCampaign(req.user, query);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne(req.user, id);
  }

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    return this.service.create(req.user, body);
  }

  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.update(req.user, id, body);
  }

  @Post(":id/items")
  addItem(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.addItem(req.user, id, body);
  }

  @Put(":id/items")
  replaceItems(@Req() req: Request, @Param("id") id: string, @Body() body: any) {
    return this.service.replaceItems(req.user, id, body?.items ?? []);
  }

  @Delete(":id/items/:itemId")
  removeItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ) {
    return this.service.removeItem(req.user, id, itemId);
  }

  @Patch(":id/send")
  send(@Req() req: Request, @Param("id") id: string) {
    return this.service.setStatus(req.user, id, "SENT");
  }

  @Patch(":id/approve")
  approve(@Req() req: Request, @Param("id") id: string) {
    return this.service.setStatus(req.user, id, "APPROVED");
  }

  @Patch(":id/reject")
  reject(@Req() req: Request, @Param("id") id: string) {
    return this.service.setStatus(req.user, id, "REJECTED");
  }

  @Post(":id/convert-to-workorder")
  convertToWorkorder(@Req() req: Request, @Param("id") id: string) {
    return this.service.convertToWorkorder(req.user, id);
  }
}
