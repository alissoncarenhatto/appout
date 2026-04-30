import { IsOptional, IsString } from "class-validator";

export class UpdateFinancialCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  tenantId?: string | number | null;
}
