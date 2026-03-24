import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  defaultPrice?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  defaultDurationMin?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  cost?: number;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tenantId?: string | number | null;
}
