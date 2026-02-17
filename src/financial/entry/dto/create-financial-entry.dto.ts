import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from "class-validator";
import { entry_type } from "@prisma/client";

export class CreateFinancialEntryDto {
  @IsEnum(entry_type)
  type!: entry_type;

  @IsNumber()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  paymentMethodId?: string | number;

  @IsOptional()
  tenantId?: string | number | null;
}
