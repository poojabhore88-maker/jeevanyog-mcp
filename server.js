import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { getJeevanYog } from "./tools/dbReader.js";
import { generateAnalysisPDF } from "./tools/pdfGenerator.js";
import { createClient } from 'redis';
import { Queue, Worker, QueueEvents } from 'bullmq';
dotenv.config({ override: true });

const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/reports', express.static(path.join(process.cwd(), 'reports')));

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey.includes("your_openai_key")) {
    console.error("❌ ERROR: Your API key is still the placeholder! Please save your .env file with the real key.");
    process.exit(1);
}

console.log(`📡 Initializing OpenAI with key starting with: ${apiKey.substring(0, 7)}...`);

const openai = new OpenAI({
    apiKey: apiKey
});

// Redis & BullMQ Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Redis setup with timeout protection
const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries > 5) return new Error('Redis reconnection failed');
            return Math.min(retries * 100, 3000);
        }
    }
});

let redisConnected = false;

redisClient.on('error', err => {
    console.error('❌ Redis Client Error:', err.message);
    redisConnected = false;
});

redisClient.on('connect', () => {
    console.log('🚀 Redis Connected');
    redisConnected = true;
});

// Avoid blocking the entire server startup if Redis is frozen
redisClient.connect().catch(err => {
    console.error('⚠️ Initial Redis connection failed:', err.message);
    redisConnected = false;
});

// BullMQ Queue Setup
const connection = { host: '127.0.0.1', port: 6379 };
const analysisQueue = new Queue('analysisQueue', { connection });
const queueEvents = new QueueEvents('analysisQueue', { connection });

// Define Worker logic
const worker = new Worker('analysisQueue', async job => {
    const { coupleId } = job.data;
    console.log(`👷 Worker started job ${job.id} for coupleId: ${coupleId}`);

    await job.updateProgress(10); // Connected

    const data = await getJeevanYog(coupleId);
    if (!data) throw new Error("Couple data not found in DB");

    await job.updateProgress(30); // Data Loaded

    const { disc, wpd, jeevanyog } = data;

    // Logic Guardrail: Assess data completeness
    const completeness = [disc, wpd, jeevanyog].filter(x => x && Object.keys(x).length > 0).length / 3;

    const prompt = `[SYSTEM: 12 EXPERTS COLLABORATION PANEL]
    You are a panel of 12 world-class marriage counsellors. Analyze the following psychometric data:
    - DISC (Personality): ${JSON.stringify(disc)}
    - WPD (Work/Personality/Values): ${JSON.stringify(wpd)}
    - JeevanYog (Synergy): ${JSON.stringify(jeevanyog)}

    CONFIDENCE SCORING GUIDELINES:
    - Base Confidence: 0.85 (if all data is present and consistent).
    - Increase (+0.1): If patterns across DISC and WPD reinforce each other.
    - Decrease (-0.1 to -0.3): If there are clear contradictions (e.g., high social score but very low communication empathy).
    - Target: We expect high confidence (0.85+) for complete data files unless severe contradictions exist.

    Return output ONLY in JSON format:
    {
      "decision": "Green|Amber|Red",
      "confidence": <0-1>,
      "expert_consensus": "A unified 2-3 sentence consensus from the 12 experts",
      "risks": ["concise high-impact risks"],
      "advice": ["strategic, actionable steps"]
    }`;

    const result = (process.env.MOCK_AI === "true") ? {
        choices: [{
            message: {
                content: JSON.stringify({
                    decision: "Amber", confidence: 0.88, expert_consensus: "MOCK: Panel consensus analyzed.",
                    risks: ["Mock financial mismatch"], advice: ["Active listening"]
                })
            }
        }]
    } : await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a professional marriage counselling panel. Provide precise, data-driven analysis." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
    });

    await job.updateProgress(70); // AI Analysis Complete

    let structuredAnalysis = JSON.parse(result.choices[0].message.content);

    // Logic Guardrail: Boost confidence if data is high quality/complete
    if (completeness === 1 && structuredAnalysis.confidence < 0.8) {
        console.log("🛠️ Boosting confidence score due to data completeness (Logic Guardrail)");
        structuredAnalysis.confidence = Math.max(structuredAnalysis.confidence, 0.82);
    }
    const pdfInfo = await generateAnalysisPDF(coupleId, structuredAnalysis);

    await job.updateProgress(90); // PDF Generated

    const resultData = {
        analysis: structuredAnalysis,
        reportUrl: `http://localhost:9000${pdfInfo.relativeUrl}`
    };

    // Also cache it in Redis for faster subsequent lookups
    const cacheKey = `analysis:${coupleId}`;
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(resultData));

    await job.updateProgress(100); // Done
    return resultData;
}, { connection });

worker.on('completed', job => console.log(`✅ Job ${job.id} completed`));
worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed: ${err.message}`);
});

// Audit Logger Helper
async function auditLog(data) {
    const entry = {
        timestamp: new Date().toISOString(),
        ...data
    };
    try {
        await fs.appendFile("audit.log", JSON.stringify(entry) + "\n");
        console.log("📝 Audit trail updated");
    } catch (err) {
        console.error("❌ Audit Logging Failed:", err.message);
    }
}

// Main Dashboard UI
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// NEW BACKEND INTEGRATION ROUTE (Queue Version)
app.post("/api/analyze/:coupleId", async (req, res) => {
    const { coupleId } = req.params;
    console.log(`🚀 Queueing analysis for coupleId: ${coupleId}`);

    try {
        if (!redisConnected) {
            throw new Error("Redis service is currently unavailable. Please check the Memurai service.");
        }

        // First check cache
        const cacheKey = `analysis:${coupleId}`;
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            return res.json({ status: 'completed', data: JSON.parse(cachedResult) });
        }

        // Add to queue
        const job = await analysisQueue.add('analyze', { coupleId }, { removeOnComplete: true });
        res.json({ status: 'queued', jobId: job.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Job Status Polling Route
app.get("/api/job-status/:jobId", async (req, res) => {
    const { jobId } = req.params;
    const job = await analysisQueue.getJob(jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

    const status = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;

    res.json({ status, progress, data: result });
});

// MAIN MCP API
app.post("/mcp/jeevanyog", async (req, res) => {
    const { coupleId } = req.body;

    if (!coupleId) {
        return res.status(400).json({ error: "coupleId is required" });
    }

    try {
        // Redis Cache Check (Only if connected)
        if (redisConnected) {
            const cacheKey = `analysis:${coupleId}`;
            const cachedResult = await redisClient.get(cacheKey);
            if (cachedResult) {
                console.log("🎯 Serving from Redis Cache");
                return res.json(JSON.parse(cachedResult));
            }
        }

        const data = await getJeevanYog(coupleId);

        if (!data) {
            return res.status(404).json({ error: "Data not found for this coupleId" });
        }

        const { disc, wpd, jeevanyog } = data;
        const completeness = [disc, wpd, jeevanyog].filter(x => x && Object.keys(x).length > 0).length / 3;

        // Create prompt for AI with "12 Experts" Persona
        const prompt = `
[SYSTEM: 12 EXPERTS COLLABORATION PANEL]
You are a panel of 12 world-class experts (including Psychologists, Financial Advisors, Relationship Coaches, Cultural Experts, and Communication Specialists). 
Your task is to analyze this couple's data with extreme precision.

DATA TO ANALYZE:
DISC: ${JSON.stringify(disc)}
WPD: ${JSON.stringify(wpd)}
JeevanYog: ${JSON.stringify(jeevanyog)}

CONFIDENCE SCORING GUIDELINES:
- Base Confidence: 0.85 (if all data is present and consistent).
- Increase (+0.1): If patterns across DISC and WPD reinforce each other.
- Decrease (-0.1 to -0.3): If there are clear contradictions.
- If data is complete, we expect 0.85+.

PROCESS:
1. Each expert weighs in on their specialty.
2. Debate the hidden risks and synergies.
3. Arrive at a unified, razor-sharp consensus.

Return output ONLY in JSON format:
{
  "decision": "Green|Amber|Red",
  "confidence": <0-1>,
  "expert_consensus": "Summary of the 12 experts debate",
  "risks": ["concise list of high-impact risks"],
  "advice": ["strategic, actionable steps for the couple"]
}
`;

        const result = (process.env.MOCK_AI === "true") ? {
            choices: [{
                message: {
                    content: JSON.stringify({
                        decision: "Amber",
                        confidence: 0.88,
                        expert_consensus: "MOCK: The panel agrees that while there is strong chemistry, financial values need alignment.",
                        risks: ["Mock financial mismatch", "Mock communication gap"],
                        advice: ["Schedule a budget workshop", "Practice active listening"]
                    })
                }
            }]
        } : await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an AI Marriage Counselling Engine powered by a virtual panel of 12 experts. Your goal is to provide deep, structured, and critical analysis."
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const analysisText = result.choices[0]?.message?.content;

        if (!analysisText) {
            throw new Error("AI could not generate an analysis.");
        }

        const structuredAnalysis = JSON.parse(analysisText);

        // Logic Guardrail: Boost confidence if data is high quality/complete
        if (completeness === 1 && structuredAnalysis.confidence < 0.8) {
            console.log("🛠️ Boosting confidence score (MCP Route) due to data completeness");
            structuredAnalysis.confidence = Math.max(structuredAnalysis.confidence, 0.82);
        }

        // GENERATE PDF REPORT
        console.log("📄 Generating PDF report...");
        const pdfInfo = await generateAnalysisPDF(coupleId, structuredAnalysis);

        const apiOutput = {
            analysis: structuredAnalysis,
            reportUrl: `http://localhost:9000${pdfInfo.relativeUrl}`
        };

        // Cache for 24 hours (if Redis is healthy)
        if (redisConnected) {
            await redisClient.setEx(cacheKey, 86400, JSON.stringify(apiOutput));
        }

        // Audit Trail: Success
        await auditLog({
            coupleId,
            type: "SUCCESS",
            result: structuredAnalysis,
            pdf: pdfInfo.relativeUrl
        });

        console.log("✅ AI Structured Analysis and PDF generated successfully");

        res.json(apiOutput);
    } catch (error) {
        console.error("❌ Error:", error.message);

        // Audit Trail: Error
        await auditLog({
            coupleId,
            type: "ERROR",
            error: error.message
        });

        res.status(500).json({
            error: error.message || "Process failed",
            details: "Please check your OpenAI API key in .env or set MOCK_AI=true"
        });
    }
});

// Chat with Expert Panel Route
app.post("/api/chat", async (req, res) => {
    const { coupleId, question } = req.body;

    if (!coupleId || !question) {
        return res.status(400).json({ error: "coupleId and question are required" });
    }

    try {
        // Redis Cache for Chat (Only if healthy)
        if (redisConnected) {
            const cacheKey = `chat:${coupleId}:${Buffer.from(question).toString('base64')}`;
            const cachedAnswer = await redisClient.get(cacheKey);
            if (cachedAnswer) {
                console.log("🎯 Serving Chat from Redis Cache");
                return res.json({ answer: cachedAnswer });
            }
        }

        const data = await getJeevanYog(coupleId);
        if (!data) return res.status(404).json({ error: "Couple data not found" });

        const { disc, wpd, jeevanyog } = data;

        // Pull previous analysis from cache to give the AI context on the expert debate
        const analysisCacheKey = `analysis:${coupleId}`;
        const cachedAnalysis = redisConnected ? await redisClient.get(analysisCacheKey) : null;
        const previousAnalysis = cachedAnalysis ? JSON.parse(cachedAnalysis) : null;

        const systemPrompt = `You are the Virtual Panel of 12 Experts for Bandhan Marriage Counselling. 
        SCOPE OF WORK:
        1. Answer ONLY questions regarding:
           - Psychometric data (DISC, WPD scores).
           - Analysis of the couple's relationship report.
           - Specific data and perspectives from the 12 expert advisor identities (Psychologists, Financial Advisors, etc.).
        2. You MUST answer relationship-focused questions (e.g., emotional safety, improvement, harmony, personality trait explanations) as they are the core of your expertise.
        3. DO NOT answer questions completely unrelated to the couple or relationship counselling (e.g., math, general knowledge, coding, general facts).
        4. If a question is truly unrelated, respond EXACTLY with: "out of scope".

        COUPLE DATA: DISC: ${JSON.stringify(disc)}, WPD: ${JSON.stringify(wpd)}, JeevanYog: ${JSON.stringify(jeevanyog)}.
        ${previousAnalysis ? `PREVIOUS EXPERT PANEL ANALYSIS: ${JSON.stringify(previousAnalysis.analysis)}` : "No previous analysis found."}

        If within scope, keep your response concise but extremely insightful using the 12 expert personas. Always use the provided data to ground your advice.`;

        const result = (process.env.MOCK_AI === "true") ? {
            choices: [{ message: { content: "MOCK: Based on their high dominance, the panel suggests creating a 'Safe Space' for communication 15 minutes a day." } }]
        } : await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question }
            ]
        });

        const answer = result.choices[0].message.content;

        // Cache chat answer for 1 hour (if Redis is healthy)
        if (redisConnected) {
            const cacheKey = `chat:${coupleId}:${Buffer.from(question).toString('base64')}`;
            await redisClient.setEx(cacheKey, 3600, answer);
        }

        res.json({ answer });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(9000, "127.0.0.1", () => {
    console.log("✅ MCP Server is ACTIVE on http://127.0.0.1:9000");
});

server.on('error', (err) => {
    console.error("❌ SERVER ERROR:", err);
});

process.on('uncaughtException', (err) => {
    console.error("❌ UNCAUGHT EXCEPTION:", err);
});
