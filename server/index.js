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
  apiKey: process.env.OPENROUTER_API_KEY
});

/* ========================
   TEST ROUTE
======================== */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

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
        reply: "No message provided"
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
    console.log(error);

    return res.status(500).json({
      reply: "AI request failed",
      videos: [],
      images: []
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});