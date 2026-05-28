import { encode } from "@toon-format/toon";

import type { ExcalidrawElement } from "../schemas";

export function serializeCanvasState(elements: ExcalidrawElement[]) {
  // since we're working with LLMs, returning messages as hints
  // instead of null will help them figure out instantly what's going on
  if (!elements.length) return "canvas: empty";

  const rows = elements.map((el) => ({
    id: el.id,
    type: el.type,
    // Excalidraw is using floating points,
    // so it's better to round them up since LLMs get wacky with floating-point numbers
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: Math.round(el.width),
    h: Math.round(el.height),
    label: el.type === "text" ? el.text : "",
    from: el.type === "arrow" ? (el.startBinding?.elementId ?? "") : "",
    to: el.type === "arrow" ? (el.endBinding?.elementId ?? "") : "",
  }));

  return encode(
    { elements: rows },
    { indent: 2, delimiter: ",", keyFolding: "off", flattenDepth: Infinity },
  );
}
