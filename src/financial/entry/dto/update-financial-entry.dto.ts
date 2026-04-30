import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { normalizeFinancialEntryType } from "./financial-entry-input";

export class UpdateFinancialEntryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeFinancialEntryType(value))
  @IsIn(["RECEIVABLE", "PAYABLE", "CREDIT", "DEBIT"])
  type?: "RECEIVABLE" | "PAYABLE";

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @IsOptional()
  @IsString()
  workOrderId?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  paymentMethodId?: string | null;

  @IsOptional()
  @IsString()
  accountId?: string | null;
}
