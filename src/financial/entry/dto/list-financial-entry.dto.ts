import { IsOptional, IsString, IsEnum, IsInt, Min } from "class-validator";
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
  @IsString()
  status?: "OPEN" | "PAID";

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
