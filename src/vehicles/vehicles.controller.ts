import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import * as fs from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { StorageService } from "src/storage/storage.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { VehiclesService } from "./vehicles.service";

function fileName(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) {
  const ext = extname(file.originalname || "").toLowerCase();
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  cb(null, name);
}

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new BadRequestException("Arquivo invalido"), false);
  }
  cb(null, true);
}

@Controller("vehicles")
export class VehiclesController {
  constructor(
    private readonly service: VehiclesService,
    private readonly storageService: StorageService,
  ) {}

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
    @Body() dto: UpdateVehicleDto,
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
        destination: (_req: Request, _file: Express.Multer.File, cb) => {
          const dest = join(process.cwd(), "uploads", "vehicles");
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: fileName,
      }),
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Arquivo nao enviado");

    const imageUrl = this.storageService.isProduction()
      ? await this.storageService.uploadLocalFile(
          "vehicles",
          file.path,
          file.filename,
          file.mimetype,
        )
      : `/uploads/vehicles/${file.filename}`;

    await this.service.updateImageUrl(id, imageUrl);
    return { imageUrl };
  }
}
