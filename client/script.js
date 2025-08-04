// client/script.js
class SmartResearchAssistant {
  constructor() {
    this.statusElement = document.getElementById("connectionStatus");
    this.queryInput = document.getElementById("queryInput");
    this.repoInput = document.getElementById("githubRepo");
    this.submitBtn = document.getElementById("submitBtn");
    this.btnText = document.getElementById("btnText");
    this.btnSpinner = document.getElementById("btnSpinner");
    this.resultsContainer = document.getElementById("results");

    this.currentSessionId = null;
    this.eventSource = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkConnection();
    await this.checkEnvironment();
    await this.testConnections();
  }

  setupEventListeners() {
    this.submitBtn.addEventListener("click", () => this.handleSubmit());

    this.queryInput.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        this.handleSubmit();
      }
    });

    // Add sample queries for easy testing
    this.addSampleQueries();
  }

  addSampleQueries() {
    const samples = [
      "Research latest AI trends and create a GitHub issue",
      "Find Node.js best practices and create implementation tasks",
      "Research TypeScript migration strategies for large codebases",
      "Analyze current web development trends for 2025",
    ];

    // Add click handlers for easy sample selection
    this.queryInput.addEventListener("focus", () => {
      if (!this.queryInput.value) {
        this.queryInput.placeholder = `Ask me to research something and take action...

Quick samples (click to use):
• ${samples.join("\n• ")}

Or type your own research query...`;
      }
    });
  }

  async checkConnection() {
    try {
      this.updateStatus("Checking connection...", "connecting");

      const response = await fetch("/api/health");
      const data = await response.json();

      if (data.status === "OK") {
        this.updateStatus(
          `✅ Connected! (Pica MCP: ${data.picaMcpPort})`,
          "connected"
        );
      } else {
        throw new Error("Health check failed");
      }
    } catch (error) {
      this.updateStatus("❌ Connection failed", "disconnected");
      console.error("Connection check failed:", error);
    }
  }

  async checkEnvironment() {
    if (window.location.hostname === "localhost") {
      try {
        const response = await fetch("/api/env-check");
        const env = await response.json();

        console.log("🔧 Environment Check:", env);

        const missing = [];
        if (!env.hasOpenAIKey) missing.push("OpenAI API Key");
        if (!env.hasPicaSecret) missing.push("Pica Secret");

        if (missing.length > 0) {
          this.addResultItem(
            "⚠️ Configuration Needed",
            `Missing environment variables: ${missing.join(
              ", "
            )}\n\nPlease add these to your .env file to enable full functionality.`
          );
        } else {
          this.addResultItem(
            "✅ Configuration Complete",
            `All required API keys are configured!\n\n🔬 Features available:\n• OpenAI Deep Research\n• GitHub Integration\n• Real-time Progress Updates`
          );
        }
      } catch (error) {
        console.log("Environment check not available (production mode)");
      }
    }
  }

  async testConnections() {
    try {
      const response = await fetch("/api/test-connections");
      const data = await response.json();

      if (data.success) {
        let statusMessage = "🔗 Service Status:\n";
        statusMessage += `• OpenAI: ${data.connections.openai ? "✅" : "❌"}\n`;
        statusMessage += `• Pica API: ${data.connections.pica ? "✅" : "❌"}\n`;
        statusMessage += `• GitHub: ${data.connections.github ? "✅" : "❌"}\n`;

        if (data.picaConnections && data.picaConnections.length > 0) {
          statusMessage += `\n📊 Pica Connections (${data.picaConnections.length}):\n`;
          data.picaConnections.forEach((conn) => {
            statusMessage += `• ${conn.name || conn.platform}: ${
              conn.status === "connected" ? "✅" : "❌"
            }\n`;
          });
        }

        this.addResultItem("🔧 Connection Test Results", statusMessage);

        if (!data.connections.github) {
          this.addResultItem(
            "⚠️ GitHub Not Connected",
            `To create GitHub issues, please connect GitHub in your Pica dashboard:\n🔗 https://app.picaos.com/connections\n\nLook for the GitHub connector and click "Connect".`
          );
        }
      }
    } catch (error) {
      console.error("Connection test failed:", error);
    }
  }

  updateStatus(message, type) {
    this.statusElement.textContent = message;
    this.statusElement.className = `status-${type}`;
  }

  async handleSubmit() {
    const query = this.queryInput.value.trim();

    if (!query) {
      alert("Please enter a research query!");
      return;
    }

    this.setLoading(true);
    this.clearResults();

    // Generate session ID for real-time updates
    this.currentSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Set up SSE connection for real-time updates
    this.setupSSEConnection(this.currentSessionId);

    try {
      // Start the research and action workflow
      await this.performResearchAndAction(query);
    } catch (error) {
      this.addResultItem(
        "❌ Error",
        `Failed to process query: ${error.message}`
      );
      this.setLoading(false);
    }
  }

  setupSSEConnection(sessionId) {
    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/sse/${sessionId}`);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleSSEUpdate(data);
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      if (this.eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE connection closed");
      }
    };
  }

  handleSSEUpdate(data) {
    const { type, step, message, result, timestamp } = data;

    switch (type) {
      case "connected":
        console.log("🔌 Connected to research stream");
        break;

      case "status":
        this.updateProgressStep(step, message);
        break;

      case "complete":
        this.handleResearchComplete(result);
        this.setLoading(false);
        break;

      case "error":
        this.addResultItem("❌ Error", `Error: ${message}`);
        this.setLoading(false);
        break;
    }
  }

  updateProgressStep(step, message) {
    const stepEmojis = {
      analyzing: "🧠",
      researching: "🔍",
      planning: "🎯",
      executing: "⚡",
      complete: "✅",
    };

    const emoji = stepEmojis[step] || "🔄";
    const capitalizedStep = step.charAt(0).toUpperCase() + step.slice(1);

    this.updateOrAddResultItem(
      `progress-${step}`,
      `${emoji} ${capitalizedStep}`,
      message
    );
  }

  async performResearchAndAction(query) {
    try {
      const githubRepo = this.repoInput.value.trim() || "test-research-repo";

      const response = await fetch("/api/research-and-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          sessionId: this.currentSessionId,
          githubRepo: githubRepo,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.details || data.error || "Unknown error occurred");
      }

      // Final result will be handled via SSE
      console.log("Research and action completed:", data);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  handleResearchComplete(result) {
    if (!result) return;

    const { research, actions } = result;

    // Add research results
    if (research) {
      this.addResultItem(
        "🎉 Research Complete",
        `✅ Successfully processed: "${
          research.query
        }"\n\n📊 Research Status: ${
          research.status
        }\n📝 Findings Available: Yes\n🕒 Completed: ${new Date(
          research.timestamp
        ).toLocaleTimeString()}`
      );

      // Show research findings (truncated for UI)
      const truncatedFindings =
        research.findings.length > 500
          ? research.findings.substring(0, 500) +
            "...\n\n[Full findings used for GitHub issue creation]"
          : research.findings;

      this.addResultItem("📋 Research Findings", truncatedFindings);
    }

    // Add action results
    if (actions && actions.length > 0) {
      actions.forEach((action) => {
        if (action.type === "github_issue") {
          if (action.success) {
            this.addResultItem(
              "🚀 GitHub Issue Created!",
              `✅ Successfully created GitHub issue\n\n📝 Title: ${action.result.title}\n📂 Repository: ${action.result.repository}\n🔢 Issue #${action.result.issueNumber}\n🔗 URL: ${action.result.issueUrl}\n\n🎯 Next steps:\n• Review the issue details\n• Add any additional context\n• Assign to team members\n• Start implementation!`
            );
          } else {
            this.addResultItem(
              "❌ GitHub Issue Creation Failed",
              `Failed to create GitHub issue:\n\n${action.error}\n\n💡 Troubleshooting:\n• Check GitHub connection in Pica dashboard\n• Verify repository exists and you have write access\n• Ensure the repository name is correct`
            );
          }
        }
      });
    }

    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  updateOrAddResultItem(id, title, content) {
    let existingItem = document.getElementById(id);

    if (existingItem) {
      existingItem.innerHTML = `
                <h3>${title}</h3>
                <p style="white-space: pre-line;">${content}</p>
                <small style="color: #666; font-size: 0.9em;">
                    ${new Date().toLocaleTimeString()}
                </small>
            `;
    } else {
      this.addResultItem(title, content, id);
    }
  }

  setLoading(isLoading) {
    this.submitBtn.disabled = isLoading;

    if (isLoading) {
      this.btnText.textContent = "Researching & Acting...";
      this.btnSpinner.classList.remove("hidden");
    } else {
      this.btnText.textContent = "Research & Act";
      this.btnSpinner.classList.add("hidden");
    }
  }

  clearResults() {
    this.resultsContainer.innerHTML = "";
  }

  addResultItem(title, content, id = null) {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    if (id) {
      resultItem.id = id;
    }

    resultItem.innerHTML = `
            <h3>${title}</h3>
            <p style="white-space: pre-line;">${content}</p>
            <small style="color: #666; font-size: 0.9em;">
                ${new Date().toLocaleTimeString()}
            </small>
        `;

    this.resultsContainer.appendChild(resultItem);
    resultItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Smart Research Assistant (Full Integration) - Starting...");
  console.log(
    "🔬 Features: OpenAI Deep Research + GitHub Integration + Real-time Updates"
  );
  new SmartResearchAssistant();
});
