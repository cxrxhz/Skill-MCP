# Personal Skills MCP Starter

A minimal Cloudflare Workers remote MCP server for ChatGPT Developer Mode.

It exposes three read-only tools:

- `list_skills`
- `get_skill`
- `fetch_reference`

The skills are stored under `skills/` and fetched through GitHub raw URLs.

## After creating your GitHub repo

Edit `wrangler.jsonc`:

```jsonc
"vars": {
  "SKILLS_RAW_BASE": "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/personal-skills-mcp/main/skills"
}
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

## Local install

```bash
npm install
npm start
```

Local MCP endpoint:

```text
http://localhost:8787/mcp
```

## Deploy

```bash
npx wrangler login
npm run deploy
```

Cloudflare will print a URL like:

```text
https://personal-skills-mcp.YOUR_ACCOUNT.workers.dev
```

Your MCP endpoint is:

```text
https://personal-skills-mcp.YOUR_ACCOUNT.workers.dev/mcp
```
