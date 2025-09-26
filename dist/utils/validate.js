"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDTO = validateDTO;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const apollo_server_express_1 = require("apollo-server-express");
async function validateDTO(cls, payload) {
    const instance = (0, class_transformer_1.plainToInstance)(cls, payload, {
        enableImplicitConversion: true,
    });
    const errors = await (0, class_validator_1.validate)(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false, value: false },
    });
    if (errors.length) {
        const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
        throw new apollo_server_express_1.UserInputError("Validation failed", { errors: messages }); // BAD_USER_INPUT
    }
    return instance;
}
