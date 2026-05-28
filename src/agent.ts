import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamAgent } from "./agent-core";

interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
}

type CanvasStatePart = { type: "data-canvas-state"; data: { elements: any[] } };

const extractCanvasState = (messages: UIMessage[]) => {
  const last = messages.at(-1);
  const part = last?.parts.find((p) => p.type === "data-canvas-state");
  return part?.data.elements ?? [];
};

export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const canvasState = extractCanvasState(this.messages);

    const result = streamAgent({
      model: openai("gpt-5.4-mini"),
      messages: await convertToModelMessages(this.messages),
      canvasState,
    });

    return result.toUIMessageStreamResponse();
  }
}
