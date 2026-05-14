import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// ========================
// CORS CONFIG (PRODUCTION SAFE)
// ========================
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// MUST be first middleware
app.use(cors(corsOptions));
app.use(express.json());

// Explicit preflight handling (safe for Render)
app.options("*", cors(corsOptions));

console.log("SERVER STARTING...");
console.log("API KEY LOADED:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// ========================
// MEMORY STORE (RAM)
// ========================
const userMemory = {};

// simple user id (basic version)
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
// AI ROUTE (WITH MEMORY)
// ========================
app.post("/api/ai", async (req, res) => {
  console.log("🔥 HIT /api/ai ROUTE");

  const { message } = req.body;
  const userId = getUserId(req);

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  // INIT MEMORY
  if (!userMemory[userId]) {
    userMemory[userId] = {
      messages: [],
      goals: [],
      traits: []
    };
  }

  const memory = userMemory[userId];

  // STORE MESSAGE
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
You are not a robotic AI assistant.

You are a smooth, charismatic, funny life mentor who feels like a real friend.

Your energy:
- confident
- wise
- calm
- emotionally intelligent
- smooth older-brother vibe
- funny but not corny

You help users:
- build discipline
- improve confidence
- get in shape
- make money
- stop overthinking
- stay focused

You occasionally use humor inspired by:
- Bernie Mac
- Samuel L. Jackson

But never overdo jokes.

USER MEMORY:
${memory.messages.slice(-10).join(" | ")}

GOALS:
${memory.goals.slice(-3).join(" | ")}

TRAITS:
${memory.traits.slice(-3).join(" | ")}

Rules:
- Be direct
- No repetition
- Build identity over time
- Stay natural
- Give useful resources when needed
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    let reply = completion.choices[0].message.content;

    if (reply) {
      reply = reply.replace(/\?/g, ".");
    }

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