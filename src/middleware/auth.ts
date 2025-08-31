import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const signToken = (user: IUser) => {
  return jwt.sign({ id: user.id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const getUserFromToken = async (token?: string) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  }
};

export const requireAuth = (user: IUser | null) => {
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};
