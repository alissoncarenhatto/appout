import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateContactLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  companyName?: string;

  @IsEmail()
  @MaxLength(191)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  sourcePage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  utmContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  website?: string;
}
