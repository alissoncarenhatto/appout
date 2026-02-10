import { IsISO8601, IsOptional, IsNumber } from "class-validator";

export class ScheduleWorkorderDto {
  @IsISO8601()
  startAt: string;

  @IsISO8601()
  endAt: string;

  @IsOptional()
  @IsNumber()
  workorderId?: number;

  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  vehicleId?: number;
}
