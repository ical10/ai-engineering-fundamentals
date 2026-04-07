import { DesignAgent } from "./agent";
import { routeAgentRequest } from "agents";

export { DesignAgent };

interface Env {
  DesignAgent: DurableObjectNamespace;
  OPENAI_API_KEY: string;
}

export default {
  // NOTE: fetch is a method based on the spec to write JS on a specific Edge functions, e.g. on Cloudflare to handle requests coming to your server
  // and will reroute the request to a specific path (we only have one route so we don't need framework e.g. Hono)
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
