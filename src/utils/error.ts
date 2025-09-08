import { GraphQLError } from "graphql";

export const ForbiddenError = () =>
  new GraphQLError("Forbidden", {
    extensions: { code: "FORBIDDEN", http: { status: 403 } },
  });

export const NotFoundError = (resource = "Resource") =>
  new GraphQLError(`${resource} not found`, {
    extensions: { code: "NOT_FOUND", http: { status: 404 } },
  });

export const ValidationError = (msg: string) => {
  new GraphQLError(msg, {
    extensions: { code: "BAD_USER_INPUT", http: { status: 400 } },
  });
};
