// server/routes/api.ts
import express, { Request, Response } from "express";
import { createOpenAIService } from "../services/openai.js";
import { createPicaService } from "../services/pica.js";
import { ActionResult, ResearchQuery, ResearchResult } from "../types/index.js";

const router = express.Router();

// SSE clients storage
const sseClients = new Map<string, Response>();

// SSE endpoint for real-time updates
router.get("/sse/:sessionId", (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Store client connection
  sseClients.set(sessionId, res);

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Connected to research stream",
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Handle client disconnect
  req.on("close", () => {
    sseClients.delete(sessionId);
    console.log(`🔌 SSE client ${sessionId} disconnected`);
  });

  console.log(`🔌 SSE client ${sessionId} connected`);
});

// Helper function to send SSE updates
function sendSSEUpdate(sessionId: string, data: any) {
  const client = sseClients.get(sessionId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Main research and action endpoint
router.post("/research-and-action", async (req: Request, res: Response) => {
  try {
    const {
      query,
      sessionId,
      githubRepo = "test-repo",
    }: {
      query: string;
      sessionId?: string;
      githubRepo?: string;
    } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
        details: "Please provide a research query",
      });
    }

    const researchQuery: ResearchQuery = {
      query,
      sessionId: sessionId || `session_${Date.now()}`,
    };

    console.log(`🔬 Starting research and action workflow for: "${query}"`);

    // Initialize services
    const openaiService = createOpenAIService();
    const picaService = createPicaService();

    let researchResult: ResearchResult;
    let actionResults: ActionResult[] = [];

    // Step 1: Send initial status
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "status",
        step: "analyzing",
        message: "Analyzing your query...",
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Conduct OpenAI research
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "status",
        step: "researching",
        message: "Conducting deep research with OpenAI...",
        timestamp: new Date().toISOString(),
      });
    }

    researchResult = await openaiService.generateResearch(researchQuery);

    if (researchResult.status === "failed") {
      throw new Error(researchResult.findings);
    }

    // Step 3: Generate GitHub issue content
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "status",
        step: "planning",
        message: "Planning GitHub issue creation...",
        timestamp: new Date().toISOString(),
      });
    }

    const issueContent = await openaiService.generateGitHubIssueContent(
      researchResult.findings,
      query
    );

    // Step 4: Create GitHub issue
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "status",
        step: "executing",
        message: "Creating GitHub issue...",
        timestamp: new Date().toISOString(),
      });
    }

    // Parse GitHub repo (default to user's first repo if not specified)
    let [owner, repo] = githubRepo.split("/");

    if (!repo) {
      // If only repo name provided, try to get the authenticated user's repo
      owner = "your-username"; // This should be replaced with actual GitHub username detection
      repo = githubRepo;
    }

    const githubAction = await picaService.createGitHubIssue({
      title: issueContent.title,
      body: issueContent.body,
      owner,
      repo,
    });

    actionResults.push(githubAction);

    // Step 5: Send completion status
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "complete",
        step: "complete",
        message: githubAction.success
          ? `GitHub issue created successfully!`
          : `GitHub issue creation failed: ${githubAction.error}`,
        timestamp: new Date().toISOString(),
        result: {
          research: researchResult,
          actions: actionResults,
        },
      });
    }

    // Return final result
    res.json({
      success: true,
      sessionId: researchQuery.sessionId,
      research: researchResult,
      actions: actionResults,
      summary: {
        query,
        researchCompleted: researchResult.status === "completed",
        actionsExecuted: actionResults.length,
        successfulActions: actionResults.filter((a) => a.success).length,
        githubIssueUrl: githubAction.success
          ? githubAction.result?.issueUrl
          : null,
      },
    });
  } catch (error: any) {
    console.error("❌ Research and action workflow failed:", error);

    const errorResponse = {
      success: false,
      error: "Research and action workflow failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    };

    // Send error via SSE if available
    const { sessionId } = req.body;
    if (sessionId) {
      sendSSEUpdate(sessionId, {
        type: "error",
        message: errorResponse.details,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json(errorResponse);
  }
});

// Get user's GitHub repositories
router.get("/github/repos/:owner", async (req: Request, res: Response) => {
  try {
    const { owner } = req.params;
    const picaService = createPicaService();

    const repos = await picaService.listGitHubRepositories(owner);

    res.json({
      success: true,
      repositories: repos,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch repositories",
      details: error.message,
    });
  }
});

// Test connections endpoint
router.get("/test-connections", async (req: Request, res: Response) => {
  try {
    const openaiService = createOpenAIService();
    const picaService = createPicaService();

    const [openaiConnected, picaConnected] = await Promise.all([
      openaiService.testConnection(),
      picaService.testConnection(),
    ]);

    let connections: any[] = [];
    let githubConnection = null;

    try {
      connections = await picaService.getConnections();
      githubConnection = await picaService.getGitHubConnection();
    } catch (error) {
      console.log(
        "⚠️ Could not fetch connection details due to API auth issues"
      );
    }

    res.json({
      success: true,
      connections: {
        openai: openaiConnected,
        pica: picaConnected,
        github: !!githubConnection,
      },
      picaConnections: connections,
      githubConnectionKey: githubConnection?.connectionKey
        ? "Connected"
        : "Not connected",
      notes: {
        openai: openaiConnected
          ? "Ready for deep research"
          : "Check OPENAI_API_KEY in .env",
        pica: picaConnected
          ? "API accessible"
          : "Check PICA_SECRET in .env and verify at https://app.picaos.com/settings/api-keys",
        github: githubConnection
          ? "GitHub integration ready"
          : "Connect GitHub at https://app.picaos.com/connections",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Connection test failed",
      details: error.message,
      guidance: {
        general: "Check your API keys and network connection",
        pica: "Visit https://app.picaos.com/settings/api-keys to verify your API key",
        openai:
          "Check your OpenAI API key at https://platform.openai.com/api-keys",
      },
    });
  }
});

export default router;
