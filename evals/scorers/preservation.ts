import type { EvalScorer } from "braintrust";
import type { AgentOutput } from "./schema";
import type { GoldenTestCase } from "../buildMessages";

// Preservation scorer: it is strictly for modify cases
// since it is no-ops on cases without preservedIds (return null so Braintrust skips it).
// Every element id the test case declares as preserved must still exist in the agent's
// output. It mainly catches the classic failure where the agent
// regenerates the whole canvas instead of patching it.
export const preservationScorer: EvalScorer<
  GoldenTestCase,
  AgentOutput,
  GoldenTestCase
> = ({ output, expected }) => {
  const preservedIds = expected?.preservedIds;
  if (!preservedIds || preservedIds.length === 0) {
    return null;
  }

  const outputIds = new Set(
    output.elements
      .filter(
        (el): el is { id: string } =>
          !!el && typeof el === "object" && "id" in el,
      )
      .map((el) => el.id),
  );

  let kept = 0;
  const missing: string[] = [];
  for (const id of preservedIds) {
    if (outputIds.has(id)) kept += 1;
    else missing.push(id);
  }

  return {
    name: "Preservation",
    score: kept / preservedIds.length,
    metadata: { kept, missing, total: preservedIds.length },
  };
};
