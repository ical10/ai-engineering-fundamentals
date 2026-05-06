import {
  generateText,
  LanguageModel,
  ModelMessage,
  stepCountIs,
  streamText,
} from "ai";
import { tools } from "./tools";

// Shared system prompt used by both the agent (worker side) and the eval
// harness (node side). Keeping it in its own file means the eval doesn't have
// to import the agent class and pull in Cloudflare-specific dependencies.

export const SYSTEM_PROMPT = `You are a diagram design assistant. You help users create and modify diagrams on an Excalidraw canvas.

When the user asks you to create a diagram, use the generateDiagram tool to produce Excalidraw elements.

Guidelines for generating diagrams:
- Give each element a unique id (e.g. "rect-1", "text-1", "arrow-1")
- Position elements with reasonable spacing (at least 20px gap between elements)
- Use rectangles for boxes/containers, ellipses for circles, diamonds for decision points
- Add text labels inside or near shapes
- Connect related elements with arrows
- Use a clean layout: left to right or top to bottom
- Default to strokeColor "#1e1e1e" and backgroundColor "transparent"
- Set roughness to 1 for a hand-drawn look

When the user asks to modify an element, use the modifyDiagram tool with the element's id.`;

interface AgentArgs {
  model: LanguageModel;
  messages: ModelMessage[];
  system?: string;
  maxSteps?: number;
}

// Streaming variant, used by the worker for the live chat experience.
export function streamAgent({
  model,
  messages,
  system = SYSTEM_PROMPT,
  maxSteps = 5,
}: AgentArgs) {
  return streamText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });
}

// Non-streaming variant, used by the eval so we can collect the full result.
export async function runAgent({
  model,
  messages,
  system = SYSTEM_PROMPT,
  maxSteps = 5,
}: AgentArgs) {
  const result = await generateText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });
  return {
    text: result.text,
    elements: extractElements(result.steps),
    steps: result.steps,
  };
}

interface StepLike {
  toolResults?: { toolName: string; output: unknown }[];
}

export function extractElements(steps: StepLike[]): unknown[] {
  // Find any generateDiagram tool calls and pull out the elements they produced.
  const elements: unknown[] = [];
  for (const step of steps) {
    for (const toolResult of step.toolResults ?? []) {
      if (toolResult.toolName === "generateDiagram") {
        const output = toolResult.output as { elements?: unknown[] };
        if (Array.isArray(output?.elements)) {
          elements.push(...output.elements);
        }
      }
    }
  }
  return elements;
}
