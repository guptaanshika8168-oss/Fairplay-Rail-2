let botSessionId = null;
let currentScore = 0;
let currentStatus = 'human';

async function initBotSession() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    botSessionId = data.sessionId;
    currentScore = data.score;
    currentStatus = data.status;
    updateStatusDisplay();
  } catch (err) {
    console.error('Failed:', err);
  }
}

async function sendSignal(type, data = {}) {
  try {
    const res = await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    const result = await res.json();
    if (result.ok) {
      currentScore = result.score;
      currentStatus = result.status;
      updateStatusDisplay();
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}

function updateStatusDisplay() {
  const statusEl = document.getElementById('bot-status');
  if (!statusEl) return;
  statusEl.className = 'badge badge-' + currentStatus;
  statusEl.textContent = currentStatus === 'human' ? '✓ Human' : currentStatus === 'challenged' ? '⚠ Challenged' : '✕ Blocked';
}

function showChallenge() {
  const challengeEl = document.getElementById('captcha-challenge');
  if (!challengeEl) return;
  challengeEl.style.display = 'block';
}

function verifyCaptcha(passed) {
  document.getElementById('captcha-challenge').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  initBotSession();
});