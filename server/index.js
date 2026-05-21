import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* ========================
   CORS (FIXED - PRODUCTION SAFE)
======================== */
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());

/* ========================
   MIDDLEWARE
======================== */
app.use(express.json());

console.log("SERVER STARTING...");
console.log("API KEY LOADED:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

/* ========================
   SIMPLE MEMORY (CLEAN)
======================== */
const userMemory = {};

function getUserId(req) {
  return req.ip || "unknown-user";
}

/* ========================
   OPENROUTER CLIENT
======================== */
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

/* ========================
   ROOT
======================== */
app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});

/* ========================
   DEBUG
======================== */
app.get("/debug123", (req, res) => {
  res.json({
    alive: true,
    time: Date.now()
  });
});

/* ========================
   AI ROUTE
======================== */
app.post("/api/ai", async (req, res) => {
  console.log("🔥 HIT /api/ai ROUTE");

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "No message provided",
        videos: [],
        images: []
      });
    }

    const userId = getUserId(req);

    if (!userMemory[userId]) {
      userMemory[userId] = {
        messages: [],
        goals: [],
        traits: []
      };
    }

    const memory = userMemory[userId];

    memory.messages.push(message);

    const lowerMsg = message.toLowerCase();

    if (
      lowerMsg.includes("goal") ||
      lowerMsg.includes("want") ||
      lowerMsg.includes("need") ||
      lowerMsg.includes("trying to")
    ) {
      memory.goals.push(message);
    } else {
      memory.traits.push(message);
    }

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: `
Return STRICT JSON ONLY:
{
  "reply": "main response text",
  "videos": [],
  "images": []
}

USER MEMORY:
${memory.messages.slice(-10).join(" | ")}

GOALS:
${memory.goals.slice(-3).join(" | ")}

TRAITS:
${memory.traits.slice(-3).join(" | ")}
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const raw = completion.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        reply: raw,
        videos: [],
        images: []
      };
    }

    return res.json(parsed);

  } catch (error) {
    console.log("AI ERROR:", error);

    return res.status(500).json({
      reply: "AI request failed",
      videos: [],
      images: []
    });
  }
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});