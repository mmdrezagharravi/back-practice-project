"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.getUserFromToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apollo_server_express_1 = require("apollo-server-express");
const User_1 = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const signToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id.toString(), role: user.role }, JWT_SECRET, {
        expiresIn: "14d",
    });
};
exports.signToken = signToken;
const getUserFromToken = async (token) => {
    if (!token)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return User_1.User.findById(decoded.id);
    }
    catch (err) {
        console.error("Invalid or expired token:", err);
        return null;
    }
};
exports.getUserFromToken = getUserFromToken;
const requireAuth = (user) => {
    if (!user)
        throw new apollo_server_express_1.ApolloError("Unauthorized: user not logged in or token invalid");
    return user;
};
exports.requireAuth = requireAuth;
const requireRole = (user, roles) => {
    (0, exports.requireAuth)(user);
    if (!roles.includes(user.role)) {
        throw new apollo_server_express_1.ForbiddenError(`Access denied. Required role(s): ${roles.join(", ")}`);
    }
};
exports.requireRole = requireRole;
