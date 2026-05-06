import type { EvalScorer } from "braintrust";
import type { AgentOutput } from "./schema";
import type { GoldenTestCase } from "../buildMessages";

// This scorer is intentionally dumb, it doesn't know semantic meaning like "OAuth"
// or that "client" and "user agent" are related.
// The score climbs once the agent eventually has RAG.

export const labelKeywordScorer: EvalScorer<
  GoldenTestCase,
  AgentOutput,
  GoldenTestCase
> = ({ output, expected }) => {
  const keywords = expected?.expectedKeywords;
  if (!keywords || keywords.length === 0) return null;

  // concatenate all strings found in agent's text response or in element labels
  // then lowercase them
  const haystack = [
    output.text,
    ...output.elements.flatMap((el) => {
      if (!el || typeof el !== "object") return [];
      const e = el as Record<string, unknown>;
      return [e.text, e.label].filter((v) => typeof v === "string") as string[];
    }),
  ]
    .join(" ")
    .toLowerCase();

  const matched = keywords.filter((kw) => haystack.includes(kw.toLowerCase()));
  return {
    name: "LabelKeywords",
    score: matched.length / keywords.length,
    metadata: {
      matched,
      missing: keywords.filter((k) => !matched.includes(k)),
    },
  };
};
