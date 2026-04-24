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
import { Public } from "../auth/public-decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateContactLeadDto } from "./dto/create-contact-lead.dto";
import { ListContactLeadQueryDto } from "./dto/list-contact-lead-query.dto";
import { ContactLeadsService } from "./contact-leads.service";

@Controller("contact-leads")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactLeadsController {
  constructor(private readonly service: ContactLeadsService) {}

  @Public()
  @Post()
  create(@Body() body: CreateContactLeadDto, @Req() req: Request) {
    return this.service.create(body, {
      ipAddress: this.pickIp(req),
      userAgent: this.pickUserAgent(req),
    });
  }

  @Get()
  @Roles("SYSTEM_ADMIN")
  list(@Req() req: Request, @Query() query: ListContactLeadQueryDto) {
    return this.service.list(req.user, query);
  }

  @Get(":id")
  @Roles("SYSTEM_ADMIN")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne(req.user, id);
  }

  @Patch(":id/status")
  @Roles("SYSTEM_ADMIN")
  updateStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { status?: string; notes?: string | null },
  ) {
    return this.service.updateStatus(req.user, id, body as any);
  }

  private pickIp(req: Request) {
    const forwarded = req.headers["x-forwarded-for"];
    const raw =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) ??
      req.socket?.remoteAddress ??
      null;
    return raw ? String(raw).split(",")[0].trim() : null;
  }

  private pickUserAgent(req: Request) {
    const ua = req.headers["user-agent"];
    return Array.isArray(ua) ? ua[0] : ua ?? null;
  }
}
