const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`workspace-app listening on http://0.0.0.0:${port}`);
  });
}

module.exports = app;
