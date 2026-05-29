import { z } from "zod";
import { tool } from "ai";

type TavilyResponse = {
  title?: string;
  content?: string;
  url?: string;
};

type TavilyResults = {
  results?: TavilyResponse[];
};

export function makeSearchWeb(apiKey: string) {
  return tool({
    description: `Search the web for current information. Use this when the user asks about tech you don't know about or never heard of or if they give you a URL to reference.

Example: searchWeb({query: "how Cloudflare Workers handle incoming requests", maxResults: 5})`,
    inputSchema: z.object({
      query: z.string(),
      maxResults: z.number().nullable(),
    }),
    execute: async ({ query, maxResults }) => {
      if (!apiKey) return { error: "API key not configured, tell the user" };

      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: maxResults ?? 5,
            search_depth: "basic",
          }),
        });
        if (!response.ok) {
          return {
            error: `Tavily returned ${response.status}: ${await response.text()}`,
          };
        }
        //TODO: Toonify this
        const data = (await response.json()) as TavilyResults;
        const results = (data.results ?? []).map((r) => ({
          title: r.title ?? "",
          content: r.content ?? "",
          url: r.url ?? "",
        }));
        return { results };
      } catch (err) {
        return {
          error: `Search failed ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });
}
