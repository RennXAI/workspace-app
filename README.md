# workspace-app

Minimal deployable Node.js + Express app with:

- A landing page at `/`
- A health check at `/healthz`
- Anthropic-powered AI assist endpoints at `/api/ai-assist` and `/api/ai-assist/health`
- Docker and Render configuration for production deployment

## Requirements

- Node.js 20+
- npm
- An Anthropic API key if you want to use `POST /api/ai-assist`

## Environment variables

Copy `.env.example` when running locally or add the same values in your hosting provider dashboard.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | For AI endpoint | none | API key used by `POST /api/ai-assist`. |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-20250514` | Anthropic model used for AI replies. |
| `PORT` | No | `3000` | HTTP port. Most hosts set this automatically. |

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY if you want AI responses.
npm start
# open http://localhost:3000
```

## Test locally

```bash
npm test
```

## Run with Docker

```bash
docker build -t workspace-app .
docker run --rm -p 3000:3000 --env-file .env workspace-app
```

## Deploy to Render (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/RennXAI/workspace-app)

1. Click the button above.
2. Sign in with GitHub and authorize Render.
3. Render reads `render.yaml`, builds the Dockerfile, and gives you a public URL.
4. Add `ANTHROPIC_API_KEY` in the Render environment settings.
5. Redeploy after adding the key.

The Render health check is configured to call `/healthz`.

## Deploy to any container platform

The included `Dockerfile` makes the app deployable to any container platform, including Cloud Run, Fly.io, Railway, ECS, Kubernetes, and similar services. The server reads `PORT` from the environment and binds on `0.0.0.0`.

Minimum production settings:

- Build command: `docker build -t workspace-app .`
- Start command: `node server.js` (already set as the Docker `CMD`)
- Health check path: `/healthz`
- Required secret for AI: `ANTHROPIC_API_KEY`

## API quick reference

### `GET /healthz`

Returns service health:

```json
{ "status": "ok" }
```

### `GET /api/ai-assist/health`

Returns whether the AI endpoint is configured:

```json
{
  "apiKeyConfigured": true,
  "model": "claude-sonnet-4-20250514"
}
```

### `POST /api/ai-assist`

Request:

```bash
curl -X POST http://localhost:3000/api/ai-assist \
  -H 'content-type: application/json' \
  -d '{"message":"Create a project launch checklist"}'
```

Response:

```json
{ "response": "..." }
```
