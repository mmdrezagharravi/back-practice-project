import { IsMongoId } from "class-validator";

export class TeamIdDto {
  @IsMongoId({ message: "Invalid teamId format" })
  teamId!: string;
}
export class ProjectIdDto {
  @IsMongoId({ message: "Invalid projectId format" })
  projectId!: string;
}
export class TaskIdDto {
  @IsMongoId({ message: "Invalid taskId format" })
  taskId!: string;
}
export class UserIdDto {
  @IsMongoId({ message: "Invalid userId format" })
  userId!: string;
}
export class GenericIdDto {
  @IsMongoId({ message: "Invalid id format" })
  id!: string;
}
