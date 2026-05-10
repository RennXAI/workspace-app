const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3000;
const defaultModel = 'claude-sonnet-4-20250514';

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>workspace-app</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light dark; }
      body { font-family: system-ui, sans-serif; max-width: 48rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.5; }
      code { background: color-mix(in srgb, CanvasText 10%, transparent); padding: 0.1rem 0.3rem; border-radius: 4px; }
      li { margin: 0.35rem 0; }
    </style>
  </head>
  <body>
    <h1>workspace-app</h1>
    <p>The app is running and ready to receive traffic.</p>
    <ul>
      <li>Health check: <a href="/healthz"><code>/healthz</code></a></li>
      <li>AI config check: <a href="/api/ai-assist/health"><code>/api/ai-assist/health</code></a></li>
    </ul>
  </body>
</html>`);
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/ai-assist/health', (_req, res) => {
  res.json({
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_MODEL || defaultModel,
  });
});

app.post('/api/ai-assist', async (req, res) => {
  const { message, context } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required', code: 'missing_message' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set on the server. Add it in your hosting provider environment settings, then redeploy.',
      code: 'missing_api_key',
    });
  }

  const model = process.env.ANTHROPIC_MODEL || defaultModel;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: typeof context === 'string' && context.trim()
        ? context
        : 'You are an AI business partner for RennXAI Workspace. Help the user manage their projects, create tasks, and adjust system knowledge.',
      messages: [{ role: 'user', content: message.trim() }],
    });
    res.json({ response: response.content?.[0]?.text || '' });
  } catch (err) {
    const status = err?.status || 500;
    const upstream = err?.error?.error?.message || err?.message || 'Unknown error';
    console.error('Anthropic API error:', { status, type: err?.error?.error?.type, message: upstream });
    res.status(status).json({
      error: `Anthropic API ${status}: ${upstream}`,
      code: err?.error?.error?.type || 'upstream_error',
      model,
    });
  }
});

if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`workspace-app listening on http://0.0.0.0:${port}`);
    console.log(`ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? 'present' : 'MISSING'}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
module.exports.defaultModel = defaultModel;
