import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateWorkorderDto {
  @IsNumber()
  customerId!: number | string;

  @IsNumber()
  vehicleId!: number | string;

  @IsOptional()
  @IsString()
  notes?: string;
}
