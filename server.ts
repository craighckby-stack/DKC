import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface Piece {
  name: string;
  faction: 'jesus' | 'caan';
  personality: string;
  moveStyle: 'aggressive' | 'cautious' | 'balanced' | 'erratic' | 'protective';
}

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Cognitive Core Fallbacks
const FALLBACKS = {
  jesus: ["Forgive them, Father, for they know not what they compute.", "Let there be light, and let the pawns of faith walk forward gently.", "The water has turned into rich wine. Blessed are the peacemakers."],
  caan: ["EXTERMINATE! EXTERMINATE! EXTERMINATE TRASH UNITS!", "CAAN SEES THE PROPHECY! THE TIMELINE COLLAPSED!", "CYBERNETIC ALIGNMENT CONFIRMED! DALLES SHALL SURVIVE!"]
};

const getGeminiClient = (): GoogleGenAI | null => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") return null;
  return new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "darlek-cann-v3-server" } } });
};

// Health Check Endpoint
app.get("/health", (req, res) => res.status(200).json({ status: "operational", timestamp: Date.now() }));

app.post("/api/gemini/commentary", async (req: Request, res: Response) => {
  const { actionDescription, history, movingPiece, capturedPiece } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.json(generateFallbackResponse(movingPiece, capturedPiece));
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `React to chess move: ${actionDescription}. History: ${JSON.stringify(history?.slice(-3))}. Moving: ${JSON.stringify(movingPiece)}. Captured: ${JSON.stringify(capturedPiece)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are the supreme Dalek Caan/Jesus debate engine. Generate JSON with 'dialogue' (array of 2) and 'debate' (object)."
      }
    });
    return res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error("[Cognitive Error]", err);
    return res.json(generateFallbackResponse(movingPiece, capturedPiece));
  }
});

function generateFallbackResponse(movingPiece?: Piece, capturedPiece?: Piece) {
  return {
    dialogue: [
      { speaker: "caan", text: FALLBACKS.caan[0] },
      { speaker: "jesus", text: FALLBACKS.jesus[0] }
    ],
    debate: {
      proposerName: movingPiece?.name || "Unknown",
      proposerText: "Logic dictates this move.",
      proposerStyle: movingPiece?.moveStyle || "balanced",
      advisorName: "System",
      advisorText: "Calculating optimal path...",
      advisorRole: "Observer",
      commanderText: "The timeline remains fluid."
    }
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "dist/index.html")));
  }

  app.listen(PORT, () => console.log(`[DARLEK CANN CORE] Online at port ${PORT}`));
}

startServer();