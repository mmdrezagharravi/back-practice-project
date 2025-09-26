"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const apollo_server_express_1 = require("apollo-server-express");
const typeDefs_1 = require("./schema/typeDefs");
const resolvers_1 = require("./schema/resolvers");
const db_1 = require("./config/db");
const auth_1 = require("./middleware/auth");
const mongoose_1 = __importDefault(require("mongoose"));
const PORT = process.env.PORT || 5000;
async function bootstrap() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error("MONGO_UR is not defined in .env file. ");
    }
    await (0, db_1.connectDB)(uri);
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    const server = new apollo_server_express_1.ApolloServer({
        typeDefs: typeDefs_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        context: async ({ req }) => {
            const auth = req.headers.authorization || "";
            const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
            const user = await (0, auth_1.getUserFromToken)(token);
            return { user };
        },
    });
    await server.start();
    server.applyMiddleware({ app, path: "/graphql" });
    const httpServer = http_1.default.createServer(app);
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
    process.on("SIGINT", async () => {
        console.log(" Shutting down server...");
        httpServer.close();
        await mongoose_1.default.disconnect();
    });
    process.on("SIGTERM", async () => {
        console.log(" Shutting down server...");
        httpServer.close();
        await mongoose_1.default.disconnect();
        process.exit(0);
    });
}
bootstrap().catch((e) => {
    console.error(" Server crashed:", e);
    process.exit(1);
});
