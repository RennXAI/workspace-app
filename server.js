const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>workspace-app</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; }
      code { background: #f3f3f3; padding: 0.1rem 0.3rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>workspace-app</h1>
    <p>The app is running. Try <a href="/healthz">/healthz</a>.</p>
  </body>
</html>`);
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/ai-assist/health', (_req, res) => {
  res.json({
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  });
});

app.post('/api/ai-assist', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set on the server. Add it in Render → Environment, then redeploy.',
      code: 'missing_api_key',
    });
  }

  const { message, context } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'message is required', code: 'missing_message' });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: context || 'You are an AI business partner for RennXAI Workspace. Help the user manage their projects, create tasks, and adjust system knowledge.',
      messages: [{ role: 'user', content: message }],
    });
    res.json({ response: response.content[0].text });
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
  app.listen(port, () => {
    console.log(`workspace-app listening on http://0.0.0.0:${port}`);
    console.log(`ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? 'present' : 'MISSING'}`);
  });
}

module.exports = app;
