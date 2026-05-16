import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* ========================
   CORS
======================== */
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

console.log("SERVER STARTING...");
console.log("API KEY LOADED:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

/* ========================
   MEMORY
======================== */
const userMemory = {};

function getUserId(req) {
  return req.ip;
}

/* ========================
   OPENROUTER
======================== */
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/* ========================
   TEST ROUTE
======================== */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ========================
   AI ROUTE
======================== */
app.post("/api/ai", async (req, res) => {
  console.log("🔥 HIT /api/ai ROUTE");

  const { message } = req.body;
  const userId = getUserId(req);

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

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

  try {
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

Rules:
- Be direct
- No repetition
- Stay natural

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

    let raw = completion.choices[0].message.content;

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
    console.log("❌ OPENROUTER ERROR:", error);

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
