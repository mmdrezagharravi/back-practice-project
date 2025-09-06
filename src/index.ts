import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import { connectDB } from "./config/db";
import { getUserFromToken } from "./middleware/auth";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB(process.env.MONGO_URI || "");

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

  app.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

bootstrap().catch((e) => {
  console.error("❌ Server crashed:", e);
  process.exit(1);
});
