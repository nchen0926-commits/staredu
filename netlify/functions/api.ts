import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { createApiRouter } from "../../lib/apiRoutes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// The netlify.toml redirect rewrites "/api/*" to this function. Depending on
// how Netlify forwards the path, the function may see the original "/api/..."
// path or the rewritten "/.netlify/functions/api/..." one — mount the same
// router at both so either shape resolves correctly.
const apiRouter = createApiRouter();
app.use("/api", apiRouter);
app.use("/.netlify/functions/api", apiRouter);

export const handler = serverless(app);
