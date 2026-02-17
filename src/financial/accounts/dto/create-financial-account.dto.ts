import { IsEnum, IsOptional, IsString, IsNumber } from "class-validator";
import { account_type } from "@prisma/client";

export class CreateFinancialAccountDto {
  @IsString()
  name!: string;

  @IsEnum(account_type)
  type!: account_type;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  tenantId?: string | number | null;
}
