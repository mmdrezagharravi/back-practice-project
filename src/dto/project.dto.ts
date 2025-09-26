import { IsMongoId, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class CreateProjectDto {
  @IsMongoId()
  teamId!: string;

  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name!: string;
}
