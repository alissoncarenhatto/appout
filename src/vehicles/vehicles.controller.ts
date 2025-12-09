import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from "@nestjs/common";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { extname, join } from "path";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as fs from "fs";
import { Request } from "express";

function fileName(req, file, cb) {
  const ext = extname(file.originalname || "").toLowerCase();
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  cb(null, name);
}

function fileFilter(req, file, cb) {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new BadRequestException("Arquivo inválido"), false);
  }
  cb(null, true);
}

@Controller("vehicles")
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.service.list(req.user);
  }

  @Get(":id")
  get(@Req() req: Request, @Param("id") id: string) {
    return this.service.get(req.user, id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateVehicleDto) {
    return this.service.create(req.user, dto);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.service.remove(req.user, id);
  }

  @Post(":id/image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), "uploads", "vehicles");
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: fileName,
      }),
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async uploadImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) throw new BadRequestException("Arquivo não enviado");
    const publicUrl = `/uploads/vehicles/${file.filename}`;
    await this.service.updateImageUrl(id, publicUrl);
    return { imageUrl: publicUrl };
  }
}
