let botSessionId = null;

async function initBotSession() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    botSessionId = data.sessionId;
  } catch (e) {}
  updateStatusDisplay('human', 'Move naturally to stay human', 0);
}

function updateStatusDisplay(status = 'human', text = 'Move naturally to stay human', score = 0) {
  const el = document.getElementById('bot-status');
  const live = document.getElementById('live-status-text');
  const scoreEl = document.getElementById('mouse-score');
  const label = document.getElementById('monitor-label');
  const bar = document.getElementById('movement-bar');

  if (el) {
    el.className = 'status-chip ' + (status === 'human' ? 'status-human' : status === 'suspicious' ? 'status-suspicious' : 'status-bot');
    el.textContent = status === 'human' ? 'Human' : status === 'suspicious' ? 'Suspicious' : 'Bot';
  }

  if (live) live.textContent = text;
  if (scoreEl) scoreEl.textContent = score;
  if (label) label.textContent = text;
  if (bar) bar.style.width = Math.min(100, Math.max(10, score)) + '%';
}

document.addEventListener('DOMContentLoaded', () => {
  initBotSession();
});