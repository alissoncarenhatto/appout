import { IsOptional, IsString } from "class-validator";

export class CreateFinancialCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  tenantId?: string | number | null;
}
