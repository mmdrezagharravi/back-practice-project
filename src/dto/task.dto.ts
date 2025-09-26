import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsISO8601,
} from "class-validator";
import { Transform } from "class-transformer";
import { TaskStatusEnum } from "./common.dto";

export class CreateTaskDto {
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsISO8601(
    {},
    { message: "dueDate must be ISO-8601 (e.g. 2025-01-31T10:00:00Z)" }
  )
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsISO8601({}, { message: "dueDate must be ISO-8601" })
  dueDate?: string;
}

export class AssignTaskDto {
  @IsMongoId()
  taskId!: string;

  @IsMongoId()
  userId!: string;
}
export class TaskListQueryDto {
  @IsMongoId()
  projectId!: string;

  @Transform(({ value }) => (value == null ? 3 : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page: number = 3;

  @Transform(({ value }) => (value == null ? 100 : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 100;

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;
}
