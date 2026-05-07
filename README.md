# workspace-app

RennXAI Workspace is a small Node.js + Express app with a browser-based AI Assist UI. The app serves a production-ready static frontend, health checks, and an API endpoint that proxies AI Assist messages to Anthropic.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- An Anthropic API key for live AI responses
- Docker, optional for container builds

## Installation

```bash
git clone https://github.com/RennXAI/workspace-app.git
cd workspace-app
npm ci
cp .env.example .env
```

Edit `.env` and add your Anthropic key before using live AI Assist responses.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `3000`. |
| `NODE_ENV` | No | Use `development` locally and `production` in deployment. |
| `ANTHROPIC_API_KEY` | Yes for AI | Server-side Anthropic API key. Never expose it in client code. |
| `ANTHROPIC_MODEL` | No | Anthropic model. Defaults to `claude-sonnet-4-6`. |
| `CORS_ORIGIN` | No | Comma-separated list of allowed browser origins for cross-origin API calls. Same-origin app usage does not require this. |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful local endpoints:

- `GET /` - AI Assist browser app
- `GET /healthz` - server health check
- `GET /api/ai-assist/health` - AI Assist configuration status
- `POST /api/ai-assist` - AI Assist completion endpoint

Example API request:

```bash
curl -X POST http://localhost:3000/api/ai-assist \
  -H 'Content-Type: application/json' \
  -d '{"message":"Create a short project checklist."}'
```

## Build

There is no bundling step. The build command performs syntax checks for the server, browser JavaScript, and tests.

```bash
npm run build
```

## Test

```bash
npm test
```

The test suite uses Node's built-in test runner and does not call Anthropic. Live AI behavior requires manual verification with `ANTHROPIC_API_KEY` set.

## Run In Production

```bash
NODE_ENV=production npm start
```

The server binds to `0.0.0.0` and reads `PORT` from the environment.

## Docker

```bash
docker build -t workspace-app .
docker run --rm -p 3000:3000 --env-file .env workspace-app
```

## Deploy To Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/RennXAI/workspace-app)

Render reads `render.yaml` and builds the included Dockerfile.

After creating the service, set these environment variables in Render:

- `ANTHROPIC_API_KEY`: required for live AI responses
- `CORS_ORIGIN`: set to your public Render URL only if another frontend will call this API from a different origin
- `ANTHROPIC_MODEL`: optional, defaults to `claude-sonnet-4-6`

## Troubleshooting

- `missing_api_key`: set `ANTHROPIC_API_KEY` in `.env` or your deployment environment, then restart or redeploy.
- `cors_origin_denied`: add the calling frontend origin to `CORS_ORIGIN`, or call the API from the same origin as this app.
- `invalid_json`: make sure requests use `Content-Type: application/json` and valid JSON bodies.
- No response from live AI: confirm the Anthropic key is valid, the selected model is available for the account, and outbound network access is allowed by the hosting platform.
