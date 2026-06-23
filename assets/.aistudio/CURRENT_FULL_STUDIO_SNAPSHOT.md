import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ARCHITECTURAL BLUEPRINT: DARLEK CANN DIALOGUE ENGINE
 * Integrates the 'epistemic_debate_engine' logic with 'SN: OMEGA' agent orchestration.
 */

interface DialogueLine {
  speaker: 'jesus' | 'caan';
  text: string;
}

const FALLBACK_POOL: Record<string, string[]> = {
  jesus: ['Forgive them, Father.', 'Let there be light.', 'Love endures all.'],
  caan: ['EXTERMINATE!', 'CAAN SEES THE PROPHECY!', 'TIMELINE COLLAPSED!']
};

class DialogueOrchestrator {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  public async generate(action: string, history: any[]): Promise<DialogueLine[]> {
    if (!this.client) return this.generateFallback();

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Action: ${action}. Context: ${JSON.stringify(history.slice(-3))}`,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a writer of comedic sci-fi. Generate a 2-line dialogue between Jesus (serene) and Dalek Caan (insane).',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dialogue: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING } }, required: ['speaker', 'text'] }
              }
            },
            required: ['dialogue']
          }
        }
      });
      return JSON.parse(response.text() || '{}').dialogue;
    } catch (err) {
      console.error('Orchestration failure, triggering fallback:', err);
      return this.generateFallback();
    }
  }

  private generateFallback(): DialogueLine[] {
    return [
      { speaker: 'jesus', text: FALLBACK_POOL.jesus[Math.floor(Math.random() * FALLBACK_POOL.jesus.length)] },
      { speaker: 'caan', text: FALLBACK_POOL.caan[Math.floor(Math.random() * FALLBACK_POOL.caan.length)] }
    ];
  }
}

const app = express();
const engine = new DialogueOrchestrator();

app.use(express.json());

app.post('/api/gemini/commentary', async (req: Request, res: Response) => {
  const { actionDescription, history } = req.body;
  if (!actionDescription) return res.status(400).json({ error: 'Missing actionDescription' });
  
  const dialogue = await engine.generate(actionDescription, history || []);
  res.json({ dialogue });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DARLEK CANN ENGINE ONLINE ON PORT ${PORT}`));