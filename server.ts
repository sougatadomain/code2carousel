import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/summarize", async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const prompt = `
      You are an expert technical educator. 
      Take the following ${language || 'programming'} code snippet and summarize its core logic into exactly 5 short, punchy bullet points.
      Each bullet point should be concise and suitable for a LinkedIn carousel slide.
      Format the output as Markdown with each bullet point as a level 2 heading (##).
      
      CODE:
      \`\`\`${language || ''}
      ${code}
      \`\`\`
      
      OUTPUT FORMAT:
      # Title of the snippet
      ## First insight
      Description of first insight.
      ## Second insight
      Description of second insight.
      ## Third insight
      Description of third insight.
      ## Fourth insight
      Description of fourth insight.
      ## Fifth insight
      Description of fifth insight.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ markdown: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize code" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
