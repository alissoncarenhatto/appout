import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plate!: string;

  @IsOptional() @IsString() brandId?: string | null;
  @IsOptional() @IsString() modelId?: string | null;
  @IsOptional() @IsInt()    year?: number | null;
  @IsOptional() @IsString() model?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  customers?: string[];

  @IsOptional() @IsString() imageUrl?: string | null; 
}
