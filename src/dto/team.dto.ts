import { IsMongoId, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class CreateTeamDto {
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name!: string;
}

export class AddUserToTeamDto {
  @IsMongoId()
  teamId!: string;

  @IsMongoId()
  userId!: string;
}

export class RemoveUserFromTeamDto {
  @IsMongoId()
  teamId!: string;

  @IsMongoId()
  userId!: string;
}
