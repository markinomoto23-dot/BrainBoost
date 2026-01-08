import { GoogleGenAI, Type } from "@google/genai";
import { GameSession, AIFeedback } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getPersonalizedCoaching = async (
  lastSession: GameSession,
  recentHistory: GameSession[]
): Promise<AIFeedback> => {
  if (!apiKey) {
    return {
      summary: "AI Coaching is unavailable (Missing API Key).",
      tip: "Keep practicing to improve your scores!",
      strength: "Self-motivation",
      areaForImprovement: "Configuration",
    };
  }

  try {
    const historySummary = recentHistory
      .slice(-5)
      .map(h => `${h.gameType}: Score ${h.score}, Acc ${h.accuracy}%`)
      .join("; ");

    const prompt = `
      The user just finished a cognitive training game called "${lastSession.gameType}" which features ADAPTIVE DIFFICULTY.
      
      Session Details:
      - Score: ${lastSession.score}
      - Accuracy: ${lastSession.accuracy}%
      - Max Level/Tier Reached: ${lastSession.levelReached} (Higher is harder)
      
      Context: 
      - In Memory Matrix, higher levels mean larger grids (up to 5x5) and faster flashes.
      - In Speed Match, reaching "Level 2" means they maintained a streak and handled complex symbols.
      
      Recent History: ${historySummary}.
      
      Provide a brief, encouraging coaching analysis for a student. 
      Mention how they handled the difficulty curve.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "1 sentence summary of performance & difficulty adaptation." },
            tip: { type: Type.STRING, description: "A specific cognitive strategy." },
            strength: { type: Type.STRING, description: "What they did well." },
            areaForImprovement: { type: Type.STRING, description: "What to focus on next time." },
          },
          required: ["summary", "tip", "strength", "areaForImprovement"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIFeedback;
    }
    
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "Great job completing the session!",
      tip: "Consistency is key to cognitive growth.",
      strength: "Persistence",
      areaForImprovement: "Try to beat your high score next time.",
    };
  }
};

export const generateDailyFact = async (): Promise<string> => {
  if (!apiKey) return "Did you know? The brain processes images 60,000 times faster than text.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Give me one interesting, scientifically accurate, short fact about neuroplasticity or learning for a high school student.",
    });
    return response.text || "Neuroplasticity allows your brain to reorganize itself by forming new neural connections throughout life.";
  } catch (e) {
    return "Neuroplasticity allows your brain to reorganize itself by forming new neural connections throughout life.";
  }
};