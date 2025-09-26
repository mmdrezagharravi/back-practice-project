"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.ForbiddenError = void 0;
const graphql_1 = require("graphql");
const ForbiddenError = () => new graphql_1.GraphQLError("Forbidden", {
    extensions: { code: "FORBIDDEN", http: { status: 403 } },
});
exports.ForbiddenError = ForbiddenError;
const NotFoundError = (resource = "Resource") => new graphql_1.GraphQLError(`${resource} not found`, {
    extensions: { code: "NOT_FOUND", http: { status: 404 } },
});
exports.NotFoundError = NotFoundError;
const ValidationError = (msg) => {
    new graphql_1.GraphQLError(msg, {
        extensions: { code: "BAD_USER_INPUT", http: { status: 400 } },
    });
};
exports.ValidationError = ValidationError;
