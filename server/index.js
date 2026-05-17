import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/* ========================
   CORS
======================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());

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
  apiKey: process.env.OPENROUTER_API_KEY
});

/* ========================
   BASE ROUTE
======================== */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ========================
   DEBUG ROUTE (IMPORTANT)
======================== */
app.get("/debug123", (req, res) => {
  res.json({ alive: true, time: Date.now() });
});

/* ========================
   TEST ROUTE
======================== */
app.get("/api/test", (req, res) => {
  res.json({ ok: true });
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
    console.log(error);

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