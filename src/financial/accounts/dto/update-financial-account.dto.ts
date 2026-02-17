import { IsEnum, IsOptional, IsString, IsNumber } from "class-validator";
import { account_type } from "@prisma/client";

export class UpdateFinancialAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(account_type)
  type?: account_type;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  tenantId?: string | number | null;
}
