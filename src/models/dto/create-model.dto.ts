import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateModelDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  brandId!: string;

  @IsOptional()
  @IsString()
  tenantId?: string | number | null;
}

