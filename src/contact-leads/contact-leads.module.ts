import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ContactLeadsAiService } from "./contact-leads-ai.service";
import { ContactLeadsController } from "./contact-leads.controller";
import { ContactLeadsEmailService } from "./contact-leads-email.service";
import { ContactLeadsService } from "./contact-leads.service";

@Module({
  imports: [PrismaModule],
  controllers: [ContactLeadsController],
  providers: [
    ContactLeadsService,
    ContactLeadsEmailService,
    ContactLeadsAiService,
  ],
})
export class ContactLeadsModule {}
