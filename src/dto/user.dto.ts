import { IsMongoId, IsOptional, IsString, IsEnum } from "class-validator";
import { Transform } from "class-transformer";
import { RoleEnum } from "./common.dto";

export class UpdateUserDto {
  @IsMongoId()
  userId!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}
