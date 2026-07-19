# Web Search API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://web-search.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Web search API for AI agents. Structured results with title, URL, snippet. Current news, docs, research. Up to 10 results per query. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "web-search": {
      "url": "https://web-search.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://web-search.api.klymax402.com/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"..."}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `web_search_query` | POST | `/api/search` | $0.008 | Search the web and return structured results |

### `web_search_query`

Semantic web search for finding relevant pages, documents, and current information. Alternative to Exa search at 3x lower cost. Returns structured JSON results with ranked matches, titles, URLs, and text snippets.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | The search query |
| `count` | number | no | Number of results to return (default: 5, max: 10) |

Example response:

```json
{"query":"best CRM for startups 2026","results":[{"title":"Top 10 CRMs for Startups in 2026","url":"https://blog.example.com/crm-startups","snippet":"HubSpot leads the pack for early-stage startups with its free tier..."},{"title":"CRM Comparison Guide","url":"https://review.example.com/crm","snippet":"We tested 15 CRM platforms across pricing, features..."}],"totalResults":5}
```

**When to use**: answering questions about current events, finding documentation, researching competitors, or gathering data on any topic. Essential for semantic web search when the agent needs up-to-date information beyond its training data. Drop-in replacement for Exa search.

**Not for**: web page content extraction (use `web_scrape_to_markdown`), SEO analysis (use `seo_audit_page`), screenshot capture (use `capture_screenshot`), company data (use `company_enrich_from_domain`).

## Example agent prompts

- "Semantic web search for finding relevant pages, documents, and current information"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
