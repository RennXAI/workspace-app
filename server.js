require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_SYSTEM_PROMPT =
  'You are an AI business partner for RennXAI Workspace. Help the user manage their projects, create tasks, and adjust system knowledge.';
let AnthropicClient;

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

function parseAllowedOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsMiddleware() {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

  if (allowedOrigins.length === 0) {
    return (_req, _res, next) => next();
  }

  return cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
  });
}

function extractTextResponse(content) {
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .filter((part) => part && part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function getAnthropicClient() {
  if (!AnthropicClient) {
    AnthropicClient = require('@anthropic-ai/sdk');
  }

  return AnthropicClient;
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);
app.use(buildCorsMiddleware());
app.use(express.json({ limit: '32kb' }));
app.use(express.static(publicDir));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/ai-assist/health', (_req, res) => {
  res.json({
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
  });
});

app.post('/api/ai-assist', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set on the server. Add it to your environment, then restart the app.',
      code: 'missing_api_key',
    });
  }

  const { message, context } = req.body || {};
  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message is required', code: 'missing_message' });
  }

  if (context !== undefined && typeof context !== 'string') {
    return res.status(400).json({ error: 'context must be a string', code: 'invalid_context' });
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const Anthropic = getAnthropicClient();
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: context?.trim() || DEFAULT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message.trim() }],
    });

    const text = extractTextResponse(response.content);
    if (!text) {
      return res.status(502).json({
        error: 'Anthropic returned an empty response.',
        code: 'empty_upstream_response',
        model,
      });
    }

    return res.json({ response: text, model });
  } catch (err) {
    const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 502;
    const upstream = err?.error?.error?.message || err?.message || 'Unknown upstream error';
    const code = err?.error?.error?.type || 'upstream_error';

    console.error('Anthropic API error:', {
      status,
      code,
      message: upstream,
    });

    return res.status(status).json({
      error: `Anthropic API ${status}: ${upstream}`,
      code,
      model,
    });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large', code: 'request_too_large' });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Request body must be valid JSON', code: 'invalid_json' });
  }

  if (err?.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed by CORS', code: 'cors_origin_denied' });
  }

  console.error('Unhandled request error:', err);
  return res.status(500).json({ error: 'Internal server error', code: 'internal_error' });
});

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`workspace-app listening on http://0.0.0.0:${port}`);
    console.log(`ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? 'present' : 'MISSING'}`);
  });
}

module.exports = app;
