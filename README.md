# 🔬 AI Research Assistant

A powerful AI-driven research assistant that combines OpenAI's deep research capabilities with Pica MCP's 70+ platform integrations to automatically research topics and take real-world actions like creating GitHub issues.

## ✨ Features

- 🧠 **OpenAI Deep Research** - Uses `o4-mini-deep-research` model with web search
- 🚀 **GitHub Integration** - Automatically creates detailed GitHub issues from research
- ⚡ **Real-time Updates** - Server-Sent Events for live progress tracking
- 🔗 **70+ Platform Support** - Powered by Pica MCP for extensive integrations
- 🎯 **End-to-End Workflow** - Research → Format → Execute Actions
- 💎 **Modern UI** - Beautiful TypeScript + Express + React interface

## 🛠️ Tech Stack

- **Backend**: TypeScript, Express 5, Node.js
- **AI**: OpenAI Responses API (Deep Research)
- **Integrations**: Pica MCP Server
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: Server-Sent Events (SSE)
- **Development**: Hot reload with tsx

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- Pica account and API key
- GitHub connection (optional, for issue creation)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-research-assistant.git
   cd ai-research-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   PICA_SECRET=your_pica_secret_key
   PORT=3000
   PICA_MCP_PORT=8001
   NODE_ENV=development
   ```

4. **Start the servers**

   Terminal 1 - Main server with hot reload:

   ```bash
   npm run dev
   ```

   Terminal 2 - Pica MCP server:

   ```bash
   npx dotenv-cli -e .env -- npx @picahq/pica-mcp --port 8001
   ```

5. **Open the application**

   http://localhost:3000

## 📖 Usage

### Example Queries

Try these research queries to see the system in action:

- "Research latest AI trends and create a GitHub issue"
- "Find TypeScript 5.0 features and create implementation tasks"
- "Research Node.js best practices and update my documentation"
- "Analyze current web development trends for 2025"

### Workflow

1. **Research Phase**: OpenAI deep research model searches the web and analyzes findings
2. **Planning Phase**: AI formats research into structured GitHub issue content
3. **Action Phase**: Pica MCP creates actual GitHub issues with detailed findings
4. **Real-time Updates**: Progress streamed live via Server-Sent Events

## 🔧 Configuration

### Pica Connections

1. Visit [Pica Dashboard](https://pica.ai)
2. Connect GitHub for issue creation
3. Optional: Connect Gmail, Slack, Google Sheets for expanded functionality

### API Keys

- **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com)
- **Pica**: Get from [Pica Settings](https://pica.ai/settings)

## 📊 Project Structure

```
ai-research-assistant/
├── client/                 # Frontend files
│   ├── index.html         # Main UI
│   ├── script.js          # Frontend logic with SSE
│   └── style.css          # Modern styling
├── server/                 # TypeScript backend
│   ├── index.ts           # Main Express server
│   ├── routes/            # API endpoints
│   │   └── api.ts         # Research & action routes
│   ├── services/          # Business logic
│   │   ├── openai.ts      # OpenAI integration
│   │   └── pica.ts        # Pica MCP integration
│   └── types/             # TypeScript definitions
│       └── index.ts       # Shared types
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── .env                   # Environment variables (not committed)
```

## 🚀 Deployment

The application can be deployed to:

- **Vercel/Netlify**: Frontend + Serverless functions
- **Railway/Render**: Full-stack deployment
- **Docker**: Containerized deployment
- **VPS**: Traditional server deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for deep research capabilities
- Pica for powerful MCP integrations
- Built with ❤️ using TypeScript and modern web technologies

## 📬 Contact

Feel free to reach out if you have questions or want to collaborate!

---

⭐ If you found this project helpful, please give it a star!
