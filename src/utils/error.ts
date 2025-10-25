import { GraphQLError } from "graphql";

export const ForbiddenError = () =>
  new GraphQLError("Forbidden", {
    extensions: { code: "FORBIDDEN", http: { status: 403 } },
  });

export const NotFoundError = (resource = "Resource") =>
  new GraphQLError(`${resource} not found`, {
    extensions: { code: "NOT_FOUND", http: { status: 404 } },
  });
