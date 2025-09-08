import jwt from "jsonwebtoken";
import { ApolloError } from "apollo-server-express";
import { User, IUser } from "../models/User";
import { error } from "console";

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
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    console.error("invalid or expired token : ", error);
    return null;
  }
};

export const requireAuth = (user: IUser | null) => {
  if (!user) {
    throw new ApolloError("Unauthorized: user not logged in or token invalid");
  }
  return user;
};
