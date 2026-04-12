import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "web-search",
  slug: "web-search",
  description: "AI-powered web search returning structured results with titles, URLs, and snippets.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/search",
      price: "$0.003",
      description: "Search the web and return structured results",
      toolName: "web_search_query",
      toolDescription: "Use this when you need to search the web for current information, news, documentation, or any topic. Accepts a text query and optional result count. Returns structured results with title, url, and snippet for each match. Do NOT use for web page content extraction — use web_scrape_to_markdown instead. Do NOT use for SEO analysis — use seo_audit_page instead. Do NOT use for screenshot capture — use capture_screenshot instead.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          count: { type: "number", description: "Number of results to return (default: 5, max: 10)" },
        },
        required: ["query"],
      },
    },
  ],
};
