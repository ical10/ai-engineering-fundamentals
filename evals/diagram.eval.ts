import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Eval } from "braintrust";
import { createOpenAI } from "@ai-sdk/openai";
import { buildMessages, GoldenTestCase } from "./buildMessages";
import { AgentOutput } from "./scorers/schema";
import { runAgent } from "../src/agent-core";
import { preservationScorer } from "./scorers/preservation";
import { labelKeywordScorer } from "./scorers/labelKeyword";
import { schemaScorer } from "./scorers/schema";
import { structureScorer } from "./scorers/structure";

config({ path: ".dev.vars" });

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const testCases: GoldenTestCase[] = JSON.parse(
  readFileSync(join("evals", "datasets", "golden.json"), "utf-8"),
);

Eval<GoldenTestCase, AgentOutput, GoldenTestCase>("Diagram Agent", {
  data: () =>
    testCases.map((tc) => ({
      input: tc,
      expected: tc,
      metadata: {
        id: tc.id,
        difficulty: tc.difficulty,
        category: tc.category,
      },
    })),

  task: async (testCase) => {
    const result = await runAgent({
      model: openai("gpt-5.4-mini"),
      messages: buildMessages(testCase),
    });
    return {
      text: result.text,
      elements: result.elements,
    };
  },

  scores: [
    schemaScorer,
    structureScorer,
    preservationScorer,
    labelKeywordScorer,
  ],
});
