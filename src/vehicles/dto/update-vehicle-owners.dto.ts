import { IsArray, ArrayNotEmpty, IsString } from "class-validator";

export class UpdateVehicleOwnersDto {
  @IsArray()
  @ArrayNotEmpty()
  customerIds!: string[];
}
