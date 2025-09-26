import { IsMongoId, IsNotEmpty, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class AddCommentDto {
  @IsMongoId()
  taskId!: string;

  @IsNotEmpty()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  text!: string;
}
