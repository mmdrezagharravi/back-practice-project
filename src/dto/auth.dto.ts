import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class RegisterDto {
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsEmail()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  email!: string;

  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  email!: string;

  @IsNotEmpty()
  password!: string;
}
