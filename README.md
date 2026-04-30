# workspace-app

Minimal Node.js + Express app that exposes a landing page and a `/healthz` endpoint.

## Deploy to Render (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/RennXAI/workspace-app)

1. Click the button above
2. Sign in with GitHub and authorize Render
3. Render reads `render.yaml`, builds the Dockerfile, and gives you a public URL
4. The free plan is fine for this app

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## Run with Docker

```bash
docker build -t workspace-app .
docker run --rm -p 3000:3000 workspace-app
```

## Deploy

The included `Dockerfile` makes the app deployable to any container platform
(Cloud Run, Fly.io, Render, Railway, ECS, Kubernetes, etc.). The server reads
`PORT` from the environment and binds on `0.0.0.0`.
