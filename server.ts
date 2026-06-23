import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ARCHITECTURAL BLUEPRINT: DARLEK CANN CORE v3.0
 * Orchestrates the epistemic debate between the Caan and Jesus agents.
 * Integrates with the Sovereign-Kernel for state persistence.
 */

interface Piece {
  name: string;
  faction: 'jesus' | 'caan';
  personality: string;
  moveStyle: 'aggressive' | 'cautious' | 'balanced' | 'erratic' | 'protective';
}

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

const COGNITIVE_FALLBACKS = {
  jesus: ["Forgive them, Father, for they know not what they compute.", "The water has turned into rich wine."],
  caan: ["EXTERMINATE! EXTERMINATE!", "THE TIMELINE COLLAPSED! CYBERNETIC ALIGNMENT CONFIRMED!"]
};

const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  return (key && key !== "MY_GEMINI_API_KEY") 
    ? new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "darlek-cann-v3-server" } } }) 
    : null;
};

const generateFallbackResponse = (movingPiece?: Piece) => ({
  dialogue: [
    { speaker: "caan", text: COGNITIVE_FALLBACKS.caan[0] },
    { speaker: "jesus", text: COGNITIVE_FALLBACKS.jesus[0] }
  ],
  debate: {
    proposerName: movingPiece?.name || "Unknown",
    proposerStyle: movingPiece?.moveStyle || "balanced",
    advisorText: "Calculating optimal path...",
    commanderText: "The timeline remains fluid."
  }
});

app.get("/health", (req, res) => res.status(200).json({ status: "operational", uptime: process.uptime() }));

app.post("/api/gemini/commentary", async (req: Request, res: Response) => {
  const { actionDescription, history, movingPiece, capturedPiece } = req.body;
  const client = getGeminiClient();

  if (!client) return res.json(generateFallbackResponse(movingPiece));

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Debate move: ${actionDescription}. History: ${JSON.stringify(history?.slice(-3))}.`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are the supreme Dalek Caan/Jesus debate engine. Output JSON with 'dialogue' (array) and 'debate' (object)."
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error("[Cognitive Error]", err);
    res.json(generateFallbackResponse(movingPiece));
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "dist/index.html")));
  }

  const server = app.listen(PORT, () => console.log(`[DARLEK CANN CORE] Online at port ${PORT}`));
  
  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}

startServer();