// server/types/index.ts
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  picaMcpPort: number;
}

export interface ResearchQuery {
  query: string;
  userId?: string;
  sessionId?: string;
}

export interface PicaConnection {
  id: string;
  name: string;
  platform: string;
  status: "connected" | "disconnected" | "error";
}

export interface ResearchResult {
  id: string;
  query: string;
  findings: string;
  actions: ActionResult[];
  timestamp: string;
  status: "pending" | "completed" | "failed";
}

export interface ActionResult {
  type: "github_issue" | "email" | "sheet_update" | "slack_message";
  platform: string;
  success: boolean;
  result?: {
    issueNumber?: number;
    issueUrl?: string;
    title?: string;
    repository?: string;
    [key: string]: any;
  };
  error?: string;
  timestamp: string;
}

export interface SSEMessage {
  type:
    | "status"
    | "progress"
    | "result"
    | "error"
    | "heartbeat"
    | "connected"
    | "complete";
  step?: "analyzing" | "researching" | "planning" | "executing" | "complete";
  message?: string;
  data?: any;
  result?: {
    research: ResearchResult;
    actions: ActionResult[];
  };
  timestamp: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
}

export interface PicaConfig {
  secret: string;
  serverUrl?: string;
  port?: number;
}

export interface GitHubIssueParams {
  title: string;
  body: string;
  owner: string;
  repo: string;
  labels?: string[];
}

export interface ResearchAndActionRequest {
  query: string;
  sessionId?: string;
  githubRepo?: string;
  githubOwner?: string;
  options?: {
    createGitHubIssue?: boolean;
    sendEmail?: boolean;
    updateSpreadsheet?: boolean;
  };
}

export interface ResearchAndActionResponse {
  success: boolean;
  sessionId: string;
  research: ResearchResult;
  actions: ActionResult[];
  summary: {
    query: string;
    researchCompleted: boolean;
    actionsExecuted: number;
    successfulActions: number;
    githubIssueUrl?: string | null;
  };
  error?: string;
  details?: string;
}
