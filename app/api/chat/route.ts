import { GoogleGenAI } from "@google/genai";
import { chatSystemInstruction } from "@/lib/qna";

const MODEL = "gemini-3.5-flash-lite";
const MAX_TURNS = 20;
const MAX_TEXT_LENGTH = 500;

interface ChatTurn {
  from: "bot" | "user";
  text: string;
}

function parseTurns(body: unknown): ChatTurn[] | null {
  if (typeof body !== "object" || body === null) return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const turns: ChatTurn[] = [];
  for (const m of messages.slice(-MAX_TURNS)) {
    if (typeof m !== "object" || m === null) return null;
    const { from, text } = m as Partial<ChatTurn>;
    if ((from !== "bot" && from !== "user") || typeof text !== "string") return null;
    turns.push({ from, text: text.slice(0, MAX_TEXT_LENGTH) });
  }
  if (turns[turns.length - 1].from !== "user") return null;
  return turns;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chưa cấu hình GEMINI_API_KEY." }, { status: 500 });
  }

  const turns = parseTurns(await request.json().catch(() => null));
  if (!turns) {
    return Response.json({ error: "Dữ liệu hội thoại không hợp lệ." }, { status: 400 });
  }

  // Gemini yêu cầu lịch sử bắt đầu bằng lượt của user, nên bỏ lời chào mở đầu của bot.
  const firstUser = turns.findIndex((t) => t.from === "user");
  const contents = turns.slice(firstUser).map((t) => ({
    role: t.from === "user" ? "user" : "model",
    parts: [{ text: t.text }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: chatSystemInstruction,
        temperature: 0.2,
        maxOutputTokens: 400,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return Response.json({ error: "Gemini không trả về nội dung." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (err) {
    console.error("[api/chat] Gemini error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Không gọi được Gemini." }, { status: 502 });
  }
}
