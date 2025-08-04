// server/index.ts
import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import { HealthCheckResponse } from "./types/index.js";

// Load environment variables
dotenv.config();

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../client")));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.path;

  // Don't log SSE heartbeats to reduce noise
  if (!url.includes("/api/sse/")) {
    console.log(`${timestamp} - ${method} ${url}`);
  }
  next();
});

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint with proper typing
app.get("/api/health", (req: Request, res: Response<HealthCheckResponse>) => {
  const healthResponse: HealthCheckResponse = {
    status: "OK",
    timestamp: new Date().toISOString(),
    picaMcpPort: parseInt(process.env.PICA_MCP_PORT || "8001", 10),
  };

  res.json(healthResponse);
});

// Environment info endpoint (development only)
if (process.env.NODE_ENV === "development") {
  app.get("/api/env-check", (req: Request, res: Response) => {
    res.json({
      nodeEnv: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasPicaSecret: !!process.env.PICA_SECRET,
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      port: PORT,
      picaMcpPort: process.env.PICA_MCP_PORT,
      features: {
        deepResearch: !!process.env.OPENAI_API_KEY,
        githubIntegration: !!process.env.PICA_SECRET,
        realTimeUpdates: true,
      },
    });
  });
}

// Serve client application
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// 404 handler - FIXED for Express 5
app.use("/*splat", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "GET /",
      "GET /api/health",
      "GET /api/env-check",
      "POST /api/research-and-action",
      "GET /api/sse/:sessionId",
      "GET /api/test-connections",
      "GET /api/github/repos/:owner",
    ],
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n🚀 Smart Research Assistant Server Starting...");
  console.log("═".repeat(60));
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `🔧 Expected Pica MCP port: ${process.env.PICA_MCP_PORT || 8001}`
  );
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("═".repeat(60));
  console.log("🔑 API Keys Status:");
  console.log(
    `   OpenAI API: ${
      process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Missing"
    }`
  );
  console.log(
    `   Pica Secret: ${
      process.env.PICA_SECRET ? "✅ Configured" : "❌ Missing"
    }`
  );
  console.log("═".repeat(60));
  console.log("🛠️  Available Endpoints:");
  console.log(
    "   POST /api/research-and-action  - Main research & GitHub integration"
  );
  console.log("   GET  /api/sse/:sessionId       - Real-time progress updates");
  console.log(
    "   GET  /api/test-connections     - Test all service connections"
  );
  console.log("   GET  /api/github/repos/:owner  - List GitHub repositories");
  console.log("═".repeat(60));
  console.log("💡 Next steps:");
  console.log(
    "   1. Make sure Pica MCP is running: npx dotenv-cli -e .env -- npx @picahq/pica-mcp --port 8001"
  );
  console.log("   2. Test connections: GET /api/test-connections");
  console.log("   3. Try a research query in the web interface!");
  console.log(
    "   4. Check GitHub connection at: https://app.picaos.com/connections"
  );
  console.log("\n🎉 Ready for AI-powered research and GitHub integration!\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully");
  process.exit(0);
});
