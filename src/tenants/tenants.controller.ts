import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname, join } from 'path';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

function fileName(req, file, cb) {
  const ext = extname(file.originalname || '').toLowerCase();
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  cb(null, name);
}

function fileFilter(req, file, cb) {
  if (!file.mimetype?.startsWith('image/')) {
    return cb(new BadRequestException('Arquivo inválido'), false);
  }
  cb(null, true);
}

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  @Roles('SYSTEM_ADMIN')
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('SYSTEM_ADMIN')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(Number(id), dto);
  }

  @Post(':id/logo')
  @Roles('SYSTEM_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'tenants');
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: fileName,
      }),
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const publicUrl = `/uploads/tenants/${file.filename}`;
    await this.service.updateLogoUrl(Number(id), publicUrl);
    return { logoUrl: publicUrl };
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
