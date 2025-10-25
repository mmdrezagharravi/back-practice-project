import "dotenv/config";
import http from "http";
import "reflect-metadata";

import express, { Application } from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";

import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import { connectDB } from "./config/db";
import { getUserFromToken } from "./middleware/auth";
import mongoose from "mongoose";

interface Context {
  user?: any | null;
}

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_UR is not defined in .env file. ");
  }
  await connectDB(uri);

  const app: Application = express();
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
      const user = await getUserFromToken(token);
      return { user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  });

  process.on("SIGINT", async () => {
    // ctrl + c
    console.log(" Shutting down server...");
    httpServer.close();
    await mongoose.disconnect();
  });
}
bootstrap().catch((error) => {
  console.error(" Server crashed:", error);
  process.exit(1); // ❌
});
