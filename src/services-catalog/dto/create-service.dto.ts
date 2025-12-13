import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  defaultPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultDurationMin?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tenantId?: string | number | null;
}
