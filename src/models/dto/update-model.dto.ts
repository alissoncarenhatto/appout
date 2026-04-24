import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string | number | null;
}

