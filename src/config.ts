import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "web-search",
  slug: "web-search",
  description: "Web search API for AI agents. Structured results with title, URL, snippet. Current news, docs, research. Up to 10 results per query.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/search",
      price: "$0.003",
      description: "Search the web and return structured results",
      toolName: "web_search_query",
      toolDescription: `Semantic web search for finding relevant pages, documents, and current information. Alternative to Exa search at 3x lower cost. Returns structured JSON results with ranked matches, titles, URLs, and text snippets.

1. results (array) -- ranked list of search results
2. results[].title (string) -- page title
3. results[].url (string) -- full URL to the page
4. results[].snippet (string) -- relevant text excerpt with query terms highlighted
5. query (string) -- the search query used
6. totalResults (number) -- number of results returned

Example output: {"query":"best CRM for startups 2026","results":[{"title":"Top 10 CRMs for Startups in 2026","url":"https://blog.example.com/crm-startups","snippet":"HubSpot leads the pack for early-stage startups with its free tier..."},{"title":"CRM Comparison Guide","url":"https://review.example.com/crm","snippet":"We tested 15 CRM platforms across pricing, features..."}],"totalResults":5}

Use this BEFORE answering questions about current events, finding documentation, researching competitors, or gathering data on any topic. Essential for semantic web search when the agent needs up-to-date information beyond its training data. Drop-in replacement for Exa search.

Do NOT use for web page content extraction -- use web_scrape_to_markdown instead. Do NOT use for SEO analysis -- use seo_audit_page instead. Do NOT use for screenshot capture -- use capture_screenshot instead. Do NOT use for company data -- use company_enrich_from_domain instead.`,
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          count: { type: "number", description: "Number of results to return (default: 5, max: 10)" },
        },
        required: ["query"],
      },
      outputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query used" },
          resultCount: { type: "number", description: "Number of results returned" },
          results: {
            type: "array",
            description: "Ranked search results",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Page title" },
                url: { type: "string", description: "Full URL" },
                snippet: { type: "string", description: "Text excerpt with query terms" },
              },
            },
          },
          source: { type: "string", description: "Search engine used" },
          timestamp: { type: "string", description: "ISO 8601 timestamp" },
        },
        required: ["query", "resultCount", "results"],
      },
    },
  ],
};
