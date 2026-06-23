import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const FALLBACKS = {
  jesus: ["Forgive them, Father.", "Let there be light.", "Love endures all."],
  caan: ["EXTERMINATE!", "CAAN SEES THE PROPHECY!", "TIMELINE COLLAPSED!"]
};

class GeminiFactory {
  private static instance: GoogleGenAI | null = null;
  static getClient() {
    if (!this.instance && process.env.GEMINI_API_KEY?.trim()) {
      this.instance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.instance;
  }
}

const app = express();
app.use(express.json());

app.post("/api/gemini/commentary", async (req, res) => {
  const { actionDescription, history } = req.body;
  const client = GeminiFactory.getClient();

  if (!client) {
    const j = FALLBACKS.jesus[Math.floor(Math.random() * FALLBACKS.jesus.length)];
    const c = FALLBACKS.caan[Math.floor(Math.random() * FALLBACKS.caan.length)];
    return res.json({ dialogue: [{ speaker: "jesus", text: j }, { speaker: "caan", text: c }] });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `React to: ${actionDescription}. History: ${JSON.stringify(history?.slice(-3))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["speaker", "text"]
              }
            }
          },
          required: ["dialogue"]
        },
        systemInstruction: "You are a writer of comedic sci-fi. Generate a 2-line dialogue between Jesus (serene) and Dalek Caan (insane)."
      }
    });
    res.json(JSON.parse(response.text() || "{}"));
  } catch (e) {
    res.status(500).json({ error: "Synthesis failed" });
  }
});

app.listen(3000);