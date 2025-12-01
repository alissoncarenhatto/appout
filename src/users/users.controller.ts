
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { Roles } from 'src/auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles('SYSTEM_ADMIN', 'TENANT_ADMIN')
  list(@Req() req: Request, @Query('q') q?: string, @Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.service.list(req.user, { q, page: Number(page) || 1, pageSize: Number(pageSize) || 50 });
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'TENANT_ADMIN')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles('SYSTEM_ADMIN', 'TENANT_ADMIN')
  create(@Req() req: Request, @Body() dto: CreateUserDto) {
    const user = req.user;
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'TENANT_ADMIN')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(req.user, id, dto);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'TENANT_ADMIN')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.service.remove(req.user, id);
  }
}
