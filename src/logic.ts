import type { Hono } from "hono";


// ATXP: requirePayment only fires inside an ATXP context (set by atxpHono middleware).
// For raw x402 requests, the existing @x402/hono middleware handles the gate.
// If neither protocol is active (ATXP_CONNECTION unset), tryRequirePayment is a no-op.
async function tryRequirePayment(price: number): Promise<void> {
  if (!process.env.ATXP_CONNECTION) return;
  try {
    const { requirePayment } = await import("@atxp/server");
    const BigNumber = (await import("bignumber.js")).default;
    await requirePayment({ price: BigNumber(price) });
  } catch (e: any) {
    if (e?.code === -30402) throw e;
  }
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// DuckDuckGo HTML scraping was dropped 2026-07-03: DDG's anomaly-detection blocks
// this server's datacenter IP outright (HTTP 202 challenge page, zero results),
// regardless of endpoint or parsing -- confirmed with a real paid x402 call in prod.
// Tavily is a real authenticated search API (agent-native, same category as Exa),
// not a scrape target, so it isn't subject to datacenter-IP anti-bot blocking.
async function searchTavily(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, max_results: count }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as { results: { title: string; url: string; content: string }[] };
  return data.results.map((r) => ({ title: r.title, url: r.url, snippet: r.content }));
}

export function registerRoutes(app: Hono) {
  app.post("/api/search", async (c) => {
    await tryRequirePayment(0.003);
    const body = await c.req.json().catch(() => null);
    if (!body?.query) {
      return c.json({ error: "Missing required field: query" }, 400);
    }

    const query: string = body.query;
    const count: number = Math.min(Math.max(parseInt(body.count) || 5, 1), 10);

    try {
      const results = await searchTavily(query, count);

      return c.json({
        query,
        resultCount: results.length,
        results,
        source: "tavily",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return c.json({ error: "Search failed: " + error.message }, 500);
    }
  });
}
