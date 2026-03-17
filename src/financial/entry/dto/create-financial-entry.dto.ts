import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export enum EntryType {
  RECEIVABLE = "RECEIVABLE",
  PAYABLE = "PAYABLE",
}

export class ListFinancialEntryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(EntryType)
  type?: EntryType;

  @IsOptional()
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
