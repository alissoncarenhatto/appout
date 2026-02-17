import { IsOptional, IsString, IsNumberString } from "class-validator";

export class ListPaymentMethodDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;
}
