import type { Hono } from "hono";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchDuckDuckGo(query: string, count: number): Promise<SearchResult[]> {
  // Use DuckDuckGo HTML search and parse results
  const encoded = encodeURIComponent(query);
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const html = await response.text();
  const results: SearchResult[] = [];

  // Parse DuckDuckGo HTML results
  const resultBlocks = html.split('class="result__body"');
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

    // Extract snippet
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]*)*)/);
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
