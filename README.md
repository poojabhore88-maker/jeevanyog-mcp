# 🔴 Bandhan MCP — AI Marriage Counselling Engine

> An AI-powered Model Context Protocol (MCP) server for Bandhan Marriage Bureau. Analyzes couples' psychometric profiles (DISC, WPD, JeevanYog) using a "12 Expert Panel" AI model to generate match decisions, confidence scores, risk assessments, and downloadable PDF reports.

---

## ✨ Features

- 🤖 **AI Expert Panel**: Simulates 12 expert counsellors (Psychologists, Financial Advisors, Relationship Coaches) using GPT-4o-mini
- 📊 **Psychometric Analysis**: Processes DISC, WPD, and JeevanYog couple data
- 🟢🟡🔴 **Match Decision**: Returns Green / Amber / Red verdict with confidence score
- 📄 **PDF Report Generation**: Auto-generates professional PDF reports for each couple
- ⚡ **Redis Caching**: BullMQ-powered async job queue + Redis caching for high performance
- 💬 **Expert Chat**: Ask follow-up questions about any couple's analysis
- 🐳 **Docker Ready**: Full Docker support for containerized deployment
- 📈 **PM2 Support**: Production process management with PM2

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js v5 |
| AI | OpenAI GPT-4o-mini |
| Queue | BullMQ |
| Cache | Redis / Memurai (Windows) |
| Database | MongoDB |
| PDF | PDFKit |
| Deployment | Docker + PM2 |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/poojabhore88-maker/jeevanyog-mcp.git
cd bandhan-mcp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your credentials:
```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://127.0.0.1:6379
MOCK_AI=false
```

### 4. Start Redis (Windows: Memurai)
Make sure Redis/Memurai is running on port `6379`.

### 5. Run the server
```bash
# Development
npm run dev

# Production (PM2)
npm run prod
```

Server starts at: **http://127.0.0.1:9000**

---

## 📡 API Endpoints

### `POST /mcp/jeevanyog`
Main analysis endpoint — runs full AI expert panel analysis.
```json
// Request Body
{ "coupleId": "COUPLE_001" }

// Response
{
  "analysis": {
    "decision": "Green",
    "confidence": 0.91,
    "expert_consensus": "...",
    "risks": ["..."],
    "advice": ["..."]
  },
  "reportUrl": "http://localhost:9000/reports/COUPLE_001.pdf"
}
```

### `POST /api/analyze/:coupleId`
Queue-based async analysis (non-blocking).
```bash
POST /api/analyze/COUPLE_001
# Returns: { "status": "queued", "jobId": "123" }
```

### `GET /api/job-status/:jobId`
Poll for async job result.
```bash
GET /api/job-status/123
# Returns: { "status": "completed", "progress": 100, "data": {...} }
```

### `POST /api/chat`
Ask expert panel follow-up questions.
```json
// Request Body
{ "coupleId": "COUPLE_001", "question": "How can they improve communication?" }
```

---

## 🐳 Docker Deployment

```bash
# Build image
docker build -t bandhan-mcp .

# Run container
docker run -p 9000:9000 --env-file .env bandhan-mcp
```

---

## 📁 Project Structure

```
bandhan-mcp/
├── server.js              # Main Express server & BullMQ worker
├── tools/
│   ├── dbReader.js        # MongoDB data reader
│   └── pdfGenerator.js    # PDF report generator
├── public/
│   └── index.html         # Dashboard UI
├── ecosystem.config.cjs   # PM2 configuration
├── Dockerfile             # Docker configuration
└── package.json
```

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key | ✅ Yes |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `REDIS_URL` | Redis connection URL | ✅ Yes |
| `MOCK_AI` | Use mock AI responses (`true`/`false`) | Optional |
| `PORT` | Server port (default: 9000) | Optional |

---

## 📝 License

ISC © Bandhan MCP
