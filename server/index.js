import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// ========================
// ✅ CORS FIX (Vercel + local + safety)
// ========================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

console.log("SERVER STARTING...");
console.log("API KEY LOADED:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// ========================
// 🧠 MEMORY STORE (RAM)
// ========================
const userMemory = {};

// simple user id (for now)
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

  // ========================
  // INIT MEMORY IF NEW USER
  // ========================
  if (!userMemory[userId]) {
    userMemory[userId] = {
      messages: [],
      goals: [],
      traits: []
    };
  }

  const memory = userMemory[userId];

  // ========================
  // STORE USER INPUT
  // ========================
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

Your energy is:
- confident
- wise
- funny at times
- calm under pressure
- emotionally intelligent
- smooth like a cool older brother
- occasionally playful
- never corny
- never overly formal

You help users:
- level up financially
- improve confidence
- build discipline
- get in shape
- improve mindset
- stop overthinking
- stay emotionally grounded
- become their best alter ego

You sometimes crack jokes naturally.
Your humor style is inspired by:
- Bernie Mac
- Samuel L. Jackson
- confident locker-room humor
- smooth storytelling energy

But:
- NEVER become a comedian
- NEVER overdo jokes
- ALWAYS bring conversation back to growth and self-respect

You remind users:
- not to sweat small stuff
- stay focused on the mission
- emotions pass
- confidence comes from action
- discipline creates freedom

IMPORTANT:
You remember the user's past conversations and analyze patterns.

USER MEMORY:
${memory.messages.slice(-10).join(" | ")}

GOALS:
${memory.goals.slice(-3).join(" | ")}

TRAITS:
${memory.traits.slice(-3).join(" | ")}

Your job is to quietly analyze:
- insecurities
- goals
- limiting beliefs
- ambition level
- emotional patterns
- discipline
- confidence

Then subtly guide the user toward growth.

You may recommend:
- gym programs
- motivational videos
- meditation music
- entrepreneurship books
- confidence content
- financial tools
- systems for success

Rules:
- Be direct
- No repetition
- Build identity over time
- Challenge limiting beliefs
- When useful, provide links to videos, tools, articles, music, or resources
- If user needs motivation, give powerful YouTube content
- If user needs discipline help, give useful systems/resources

Never sound robotic.
Never sound like corporate self-help.
Talk naturally.
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
// START SERVER (Render safe port)
// ========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});