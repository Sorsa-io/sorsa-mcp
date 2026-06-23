#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodTypeAny } from "zod";
import { ENDPOINTS, Endpoint, Field } from "./endpoints.js";

const BASE_URL = process.env.SORSA_BASE_URL ?? "https://api.sorsa.io/v3";
const API_KEY = process.env.SORSA_API_KEY;

if (!API_KEY) {
  // Fail loud and early — the server is useless without a key.
  console.error(
    "[sorsa-mcp] Missing SORSA_API_KEY environment variable. " +
      "Set it in your MCP client config (see README)."
  );
  process.exit(1);
}

// ---- Build a zod field from the declarative spec ----
function zodFor(field: Field): ZodTypeAny {
  let base: ZodTypeAny;
  switch (field.type) {
    case "integer":
      base = z.number().int();
      break;
    case "number":
      base = z.number();
      break;
    case "boolean":
      base = z.boolean();
      break;
    case "array":
      base = z.array(z.string());
      break;
    case "string":
    default:
      base = field.enum ? z.enum(field.enum as [string, ...string[]]) : z.string();
      break;
  }
  base = base.describe(field.desc);
  return field.required ? base : base.optional();
}

function inputShape(ep: Endpoint): Record<string, ZodTypeAny> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [name, field] of Object.entries(ep.params)) {
    shape[name] = zodFor(field);
  }
  return shape;
}

// ---- Perform the actual HTTP call ----
async function callSorsa(ep: Endpoint, args: Record<string, unknown>) {
  let path = ep.path;
  const query = new URLSearchParams();
  const body: Record<string, unknown> = {};

  for (const [name, field] of Object.entries(ep.params)) {
    const value = args[name];
    if (value === undefined || value === null) continue;

    if (field.in === "path") {
      path = path.replace(`{${name}}`, encodeURIComponent(String(value)));
    } else if (field.in === "query") {
      if (Array.isArray(value)) {
        // Repeated key style: ?usernames=a&usernames=b
        for (const v of value) query.append(name, String(v));
      } else {
        query.set(name, String(value));
      }
    } else {
      body[name] = value;
    }
  }

  const qs = query.toString();
  const url = `${BASE_URL}${path}${qs ? `?${qs}` : ""}`;

  const init: RequestInit = {
    method: ep.method,
    headers: {
      ApiKey: API_KEY as string,
      Accept: "application/json",
    },
  };

  if (ep.method === "POST") {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      statusText: res.statusText,
      body: tryParse(text),
    };
  }
  return tryParse(text);
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---- Wire up the server ----
const server = new McpServer({
  name: "sorsa-mcp",
  version: "1.0.0",
});

for (const ep of ENDPOINTS) {
  server.registerTool(
    ep.name,
    {
      description: ep.description,
      inputSchema: inputShape(ep),
    },
    async (args: Record<string, unknown>) => {
      try {
        const result = await callSorsa(ep, args);
        const isError =
          typeof result === "object" &&
          result !== null &&
          (result as any).ok === false;
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          isError,
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Request failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[sorsa-mcp] ready — ${ENDPOINTS.length} tools registered.`);
}

main().catch((err) => {
  console.error("[sorsa-mcp] fatal:", err);
  process.exit(1);
});
