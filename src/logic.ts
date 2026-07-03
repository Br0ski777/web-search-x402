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

async function searchDuckDuckGo(query: string, count: number): Promise<SearchResult[]> {
  // Use DuckDuckGo HTML search and parse results.
  // NOTE: the /html/ endpoint's <form> is method="post" — a GET request returns an
  // empty results shell (no results, no error). Must POST the query.
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `q=${encodeURIComponent(query)}`,
  });

  const html = await response.text();
  const results: SearchResult[] = [];

  // Parse DuckDuckGo HTML results. The result container is
  // `<div class="result results_links ...">` wrapping a
  // `<div class="links_main links_deep result__body">` — split on the outer
  // container since the exact class string "result__body" never appears verbatim.
  const resultBlocks = html.split(/<div class="result results_links/);
  for (let i = 1; i < resultBlocks.length && results.length < count; i++) {
    const block = resultBlocks[i];

    // Extract title
    const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)</);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : "";

    // Extract URL
    const urlMatch = block.match(/class="result__url"[^>]*href="([^"]*)"/) ||
                     block.match(/class="result__a"[^>]*href="([^"]*)"/);
    let url = urlMatch ? urlMatch[1].trim() : "";
    // DuckDuckGo wraps URLs in redirect, extract actual URL
    if (url.includes("uddg=")) {
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
    }
    if (!url.startsWith("http")) {
      // Try to extract from result__url text
      const urlTextMatch = block.match(/class="result__url"[^>]*>\s*([^<\s]+)/);
      if (urlTextMatch) url = "https://" + urlTextMatch[1].trim();
    }

    // Extract snippet. Query terms are wrapped in <b> and can appear as the very
    // first character (e.g. "<b>Bitcoin</b> is..."), so the captured span must allow
    // starting on a tag, not just on plain text.
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    let snippet = snippetMatch ? snippetMatch[1].trim() : "";
    snippet = snippet.replace(/<[^>]+>/g, "").trim();
    snippet = decodeHTMLEntities(snippet);

    if (title && url) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
      const results = await searchDuckDuckGo(query, count);

      return c.json({
        query,
        resultCount: results.length,
        results,
        source: "duckduckgo",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return c.json({ error: "Search failed: " + error.message }, 500);
    }
  });
}
