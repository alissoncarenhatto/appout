import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTenantDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsOptional()
  code?: string;
}
