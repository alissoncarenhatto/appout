import {
  IsArray,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateVehicleDto {
  @IsOptional() @IsString() @MaxLength(20) plate?: string;
  @IsOptional() @IsString() brandId?: string | null;
  @IsOptional() @IsString() modelId?: string | null;
  @IsOptional() @IsInt() year?: number | null;
  @IsOptional() @IsString() model?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  customers?: string[];

  @IsOptional() @IsString() imageUrl?: string | null;

  @IsOptional()
  tenantId?: any | null;
}
