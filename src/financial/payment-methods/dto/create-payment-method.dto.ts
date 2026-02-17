import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";
import { payment_type } from "@prisma/client";

export class CreatePaymentMethodDto {
  @IsString()
  name!: string;

  @IsEnum(payment_type)
  type!: payment_type;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  allowInstallments?: boolean;

  @IsOptional()
  @IsNumber()
  defaultInstallments?: number;

  @IsOptional()
  @IsNumber()
  feePercent?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tenantId?: string | number | null;
}
