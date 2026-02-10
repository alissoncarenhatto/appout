import { IsNumber, IsOptional } from "class-validator";

export class AddServiceDto {
  @IsNumber()
  serviceId!: number | string;

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
