import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateBrandDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  tenantId?: string | number | null;
}

