import { IsNumber, IsOptional } from "class-validator";

export class AddPartDto {
  @IsNumber()
  partId!: number | string;

  @IsOptional()
  @IsNumber()
  qty?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;
}
