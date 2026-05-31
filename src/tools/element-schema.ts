import { z } from "zod";

// Shared element schema. The descriptions on each field aren't just for
// validation, they're part of the prompt the model reads when it loads the
// tool. Use them to teach the model how Excalidraw actually works, especially
// the gotchas it would otherwise get wrong (text labels, arrow bindings).
//
// Nullable rather than optional so OpenAI strict mode stays on. Null means
// "not applicable for this element type" (e.g. points on a rectangle).
//
// We're using union because it's better at telling the LLM which schema is specific to each shape,
// instead of letting it guess by itself whenever creating a shape.
// So it doesn't make a silly mistake e.g. omitting `start` and `end` fields for type: `arrow`.

const styling = {
  strokeColor: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  fillStyle: z.enum(["solid", "hachure", "cross-hatcher"]).nullable(),
  strokeWidth: z.number().nullable(),
  roughness: z.number().nullable(),
  opacity: z.number().nullable(),
};

const labelSchema = z.object({
  text: z.string(),
  fontSize: z.number().nullable(),
  textAlign: z.enum(["left", "center", "right"]).nullable(),
});

const baseFields = {
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
};

const rectangleSchema = z.object({
  type: z.literal("rectangle"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

const ellipseSchema = z.object({
  type: z.literal("ellipse"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

const diamondSchema = z.object({
  type: z.literal("diamond"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

const endpointSchema = z.object({ id: z.string() });

const arrowSchema = z.object({
  type: z.literal("arrow"),
  ...baseFields,
  start: endpointSchema.nullable(),
  end: endpointSchema.nullable(),
  label: labelSchema.nullable(),
  ...styling,
});

const lineSchema = z.object({
  type: z.literal("line"),
  ...baseFields,
  start: endpointSchema.nullable(),
  end: endpointSchema.nullable(),
  ...styling,
});

const textSchema = z.object({
  type: z.literal("text"),
  ...baseFields,
  text: z.string(),
  fontSize: z.number().nullable(),
  textAlign: z.enum(["left", "center", "right"]).nullable(),
  ...styling,
});

export const elementSchema = z.union([
  rectangleSchema,
  ellipseSchema,
  diamondSchema,
  arrowSchema,
  lineSchema,
  textSchema,
]);
