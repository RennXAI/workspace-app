const form = document.querySelector('#assist-form');
const messageInput = document.querySelector('#message');
const contextInput = document.querySelector('#context');
const submitButton = document.querySelector('#submit-button');
const output = document.querySelector('#response-output');
const serverStatus = document.querySelector('#server-status');
const modelStatus = document.querySelector('#model-status');
const keyStatus = document.querySelector('#key-status');

function setOutput(text, state) {
  output.textContent = text;
  output.classList.remove('error', 'success');

  if (state) {
    output.classList.add(state);
  }
}

async function checkHealth() {
  try {
    const [serverResponse, aiResponse] = await Promise.all([
      fetch('/healthz'),
      fetch('/api/ai-assist/health'),
    ]);

    serverStatus.textContent = serverResponse.ok ? 'Online' : 'Unavailable';

    if (!aiResponse.ok) {
      modelStatus.textContent = 'Unavailable';
      keyStatus.textContent = 'Unknown';
      return;
    }

    const health = await aiResponse.json();
    modelStatus.textContent = health.model || 'Not configured';
    keyStatus.textContent = health.apiKeyConfigured ? 'Configured' : 'Missing';
  } catch (_err) {
    serverStatus.textContent = 'Offline';
    modelStatus.textContent = 'Unavailable';
    keyStatus.textContent = 'Unknown';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  const context = contextInput.value.trim();

  if (!message) {
    setOutput('Enter a message before sending.', 'error');
    messageInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Asking...';
  setOutput('Working on it...', null);

  try {
    const response = await fetch('/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...(context ? { context } : {}),
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setOutput(payload.error || 'AI Assist returned an error.', 'error');
      return;
    }

    setOutput(payload.response || 'AI Assist returned an empty response.', 'success');
    await checkHealth();
  } catch (_err) {
    setOutput('Unable to reach AI Assist. Check that the server is running.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Ask AI Assist';
  }
});

checkHealth();
