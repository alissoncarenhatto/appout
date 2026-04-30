import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  IsDateString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import {
  normalizeFinancialEntryStatus,
  normalizeFinancialEntryType,
} from "./financial-entry-input";

export enum EntryType {
  RECEIVABLE = "RECEIVABLE",
  PAYABLE = "PAYABLE",
}

export class ListFinancialEntryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeFinancialEntryType(value))
  @IsIn(["RECEIVABLE", "PAYABLE", "CREDIT", "DEBIT"])
  type?: EntryType;

  @IsOptional()
  @Transform(({ value }) => normalizeFinancialEntryStatus(value))
  @IsIn(["OPEN", "PAID", "OVERDUE", "PENDING", "COMPLETED"])
  status?: "OPEN" | "PAID" | "OVERDUE";

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}
