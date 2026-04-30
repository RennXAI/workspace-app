# workspace-app

Minimal Node.js + Express app that exposes a landing page and a `/healthz` endpoint.

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
