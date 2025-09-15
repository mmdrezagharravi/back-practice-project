import jwt from "jsonwebtoken";
import { ApolloError, ForbiddenError } from "apollo-server-express";
import { User, IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

interface TokenPayload {
  id: string;
  role: string;
}

export const signToken = (user: IUser) => {
  return jwt.sign({ id: user.id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: "14d",
  });
};

export const getUserFromToken = async (token?: string) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return User.findById(decoded.id);
  } catch (err) {
    console.error("Invalid or expired token:", err);
    return null;
  }
};

export const requireAuth = (user: IUser | null): IUser => {
  if (!user)
    throw new ApolloError("Unauthorized: user not logged in or token invalid");
  return user;
};

export const requireRole = (user: IUser | null, roles: string[]) => {
  requireAuth(user);
  if (!roles.includes(user!.role)) {
    throw new ForbiddenError(
      `Access denied. Required role(s): ${roles.join(", ")}`
    );
  }
};
