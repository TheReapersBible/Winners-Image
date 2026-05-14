import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* ========================
   🚨 BULLETPROOF CORS FIX
   (replaces cors package)
======================== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request immediately
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

console.log("SERVER STARTING...");
console.log("API KEY LOADED:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// ========================
// MEMORY STORE
// ========================
const userMemory = {};

function getUserId(req) {
  return req.ip;
}

// OpenRouter client
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ========================
// TEST ROUTE
// ========================
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ========================
// AI ROUTE
// ========================
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

  console.log("🧠 MEMORY STATE:", memory);

  try {
    console.log("CALLING OPENROUTER...");

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: `
You are a smooth, confident life mentor.

Help the user build discipline, confidence, money skills, and focus.

Be natural, not robotic.

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

    let reply = completion.choices[0].message.content;

    reply = reply ? reply.replace(/\?/g, ".") : "No response";

    console.log("✅ AI RESPONSE SUCCESS");

    res.json({ reply });

  } catch (error) {
    console.log("❌ OPENROUTER ERROR:");
    console.dir(error, { depth: null });

    res.status(500).json({
      reply: "AI request failed"
    });
  }
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});