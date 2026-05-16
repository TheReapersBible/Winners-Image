import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* ========================
   TRUST PROXY (RENDER)
======================== */
app.set("trust proxy", true);

/* ========================
   CORS
======================== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors());

/* ========================
   BODY PARSER
======================== */
app.use(express.json());

console.log("SERVER STARTING...");
console.log(
  "API KEY LOADED:",
  process.env.OPENROUTER_API_KEY ? "YES" : "NO"
);

/* ========================
   MEMORY STORE
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
  apiKey: process.env.OPENROUTER_API_KEY,
});

/* ========================
   TEST ROUTE
======================== */
app.get("/", (req, res) => {
  res.json({
    status: "Backend running"
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

    console.log("🧠 MEMORY STATE:", memory);

    console.log("CALLING OPENROUTER...");

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: `
You are a smooth, charismatic life mentor.

Return STRICT JSON ONLY:

{
  "reply": "main response text",
  "videos": [],
  "images": []
}

Rules:
- Be direct
- No repetition
- Build identity over time
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

    console.log("RAW AI OUTPUT:", raw);

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

    console.log("✅ AI RESPONSE SUCCESS");

    res.json(parsed);

  } catch (error) {
    console.error("❌ SERVER ERROR:");
    console.error(error);

    res.status(500).json({
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