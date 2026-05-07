const assert = require('node:assert/strict');
const { after, before, beforeEach, describe, it } = require('node:test');

let app;
let baseUrl;
let server;

function clearEnv() {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_MODEL;
  delete process.env.CORS_ORIGIN;
}

describe('workspace-app', () => {
  before(async () => {
    clearEnv();
    app = require('../server');

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    clearEnv();
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('serves the browser app at /', async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(body, /AI Assist/);
  });

  it('returns health status', async () => {
    const response = await fetch(`${baseUrl}/healthz`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  it('reports AI Assist configuration without exposing secrets', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-secret-key';
    process.env.ANTHROPIC_MODEL = 'test-model';

    const response = await fetch(`${baseUrl}/api/ai-assist/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      apiKeyConfigured: true,
      model: 'test-model',
    });
    assert.doesNotMatch(JSON.stringify(body), /test-secret-key/);
  });

  it('rejects missing message requests before using the API key', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-secret-key';

    const response = await fetch(`${baseUrl}/api/ai-assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'message is required',
      code: 'missing_message',
    });
  });

  it('rejects invalid context requests before using the API key', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-secret-key';

    const response = await fetch(`${baseUrl}/api/ai-assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello', context: { role: 'bad' } }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'context must be a string',
      code: 'invalid_context',
    });
  });

  it('returns a safe error when ANTHROPIC_API_KEY is missing', async () => {
    const response = await fetch(`${baseUrl}/api/ai-assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.code, 'missing_api_key');
    assert.match(body.error, /ANTHROPIC_API_KEY/);
  });
});
