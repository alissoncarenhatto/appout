import { IsEmail, IsOptional, IsString, MinLength, IsIn, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;

  @IsString() @IsIn(['SYSTEM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER'])
  role: string;

  @IsOptional()
  tenantId?: string | number;
}
