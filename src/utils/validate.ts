import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UserInputError } from "apollo-server-express";

export async function validateDTO<T>(
  cls: new () => T,
  payload: unknown
): Promise<T> {
  const instance = plainToInstance(cls, payload as object, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance as any, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  });

  if (errors.length) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints || {})
    );
    throw new UserInputError("Validation failed", { errors: messages });
  }
  return instance;
}
