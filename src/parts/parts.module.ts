import { Module } from "@nestjs/common";
import { PartsService } from "./parts.service";
import { PartsController } from "./parts.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [PartsService],
  controllers: [PartsController],
})
export class PartsModule {}
