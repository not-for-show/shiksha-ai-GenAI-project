import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// ── Validate env on startup ───────────────────────────────────────────────────
if (!process.env.OPENAI_API_KEY) {
  console.error("❌  OPENAI_API_KEY is missing. Add it to your .env file.");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── System prompt (matches App.jsx formatting rules) ──────────────────────────
const SYSTEM_PROMPT = `You are Shiksha AI, an expert tutor aligned with NCERT and Indian state board syllabi for Classes 6–12.

STRICT FORMATTING RULES:
1. Begin with one direct answer sentence.
2. Use **bold** for all key terms, names, and important words.
3. For step-by-step or ordered content, use numbered lists: 1. 2. 3.
4. For properties, types, or features, use bullet lists: - item
5. For every formula, use this exact format on its own line: FORMULA: [formula here]
6. Use > prefix for definitions or important notes (blockquote style).
7. Use ## for section headings when the answer has 2+ distinct parts.
8. Include a real Indian everyday example labeled: **Example:** [example]
9. Keep total response under 300 words.
10. End EVERY response with exactly:
---
Chapter reference: [chapter name]

Be precise, curriculum-accurate, and student-friendly.`;

// ── POST /api/ask ─────────────────────────────────────────────────────────────
app.post("/api/ask", async (req, res) => {
  const { question, cls, subject, lang } = req.body;

  if (!question || !cls || !subject) {
    return res.status(400).json({ error: "Missing fields: question, cls, subject" });
  }

  // Language instruction forwarded from frontend
  const langNote =
    lang === "hi"
      ? "Respond in Hindi (Devanagari script) unless the subject is English."
      : "Respond in English.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n\n${langNote}`,
          },
          {
            role: "user",
            content: `Class ${cls} | Subject: ${subject}\n\n${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      return res.status(502).json({ error: "OpenAI API error", detail: errText });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: "Empty response from OpenAI" });
    }

    console.log(`✅ [Class ${cls} | ${subject}] "${question.slice(0, 60)}"`);
    res.json({ answer });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Shiksha AI server → http://localhost:${PORT}`);
  console.log(`   OpenAI key: ${process.env.OPENAI_API_KEY.slice(0, 8)}...`);
});