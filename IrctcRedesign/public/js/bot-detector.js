(() => {
  const state = {
    moves: 0,
    clicks: 0,
    scrolls: 0,
    keys: 0,
    touches: 0,
    blurCount: 0,
    lastX: null,
    lastY: null,
    score: 0,
    mode: 'human',
    startedAt: Date.now()
  };

  let throttle = 0;

  function setStatus(mode, text, score) {
    const el = document.getElementById('bot-status');
    const live = document.getElementById('live-status-text');
    const scoreEl = document.getElementById('mouse-score');
    const label = document.getElementById('monitor-label');
    const bar = document.getElementById('movement-bar');

    if (el) {
      el.className = 'status-chip ' + (
        mode === 'human' ? 'status-human' :
        mode === 'suspicious' ? 'status-suspicious' : 'status-bot'
      );
      el.textContent = mode === 'human' ? 'Human' : mode === 'suspicious' ? 'Suspicious' : 'Bot';
    }

    if (live) live.textContent = text;
    if (scoreEl) scoreEl.textContent = score;
    if (label) label.textContent = text;
    if (bar) bar.style.width = Math.max(10, Math.min(100, score)) + '%';
  }

  function computeScore() {
    const timeAlive = Math.floor((Date.now() - state.startedAt) / 1000);
    const motionScore = Math.min(40, state.moves * 2);
    const clickScore = Math.min(15, state.clicks * 3);
    const scrollScore = Math.min(10, state.scrolls * 2);
    const keyScore = Math.min(15, state.keys * 2);
    const touchScore = Math.min(10, state.touches * 3);
    const blurPenalty = Math.min(20, state.blurCount * 8);
    const timeScore = Math.min(10, timeAlive);

    const score = motionScore + clickScore + scrollScore + keyScore + touchScore + timeScore - blurPenalty;
    return Math.max(0, Math.min(100, score));
  }

  function update() {
    const score = computeScore();
    let mode = 'human';
    let text = 'Human activity detected';

    if (score < 15) {
      mode = 'bot';
      text = 'Bot-like activity detected';
    } else if (score < 35) {
      mode = 'suspicious';
      text = 'Suspicious activity detected';
    }

    state.score = score;
    state.mode = mode;
    setStatus(mode, text, score);
  }

  function markHuman() {
    update();
  }

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - throttle < 18) return;
    throttle = now;

    state.moves += 1;

    if (state.lastX !== null && state.lastY !== null) {
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      if (Math.hypot(dx, dy) > 2) {
        state.moves += 0;
      }
    }

    state.lastX = e.clientX;
    state.lastY = e.clientY;
    markHuman();
  }, { passive: true });

  document.addEventListener('click', () => {
    state.clicks += 1;
    markHuman();
  }, { passive: true });

  document.addEventListener('scroll', () => {
    state.scrolls += 1;
    markHuman();
  }, { passive: true });

  document.addEventListener('keydown', () => {
    state.keys += 1;
    markHuman();
  }, { passive: true });

  document.addEventListener('touchstart', () => {
    state.touches += 1;
    markHuman();
  }, { passive: true });

  window.addEventListener('blur', () => {
    state.blurCount += 1;
    update();
  });

  window.addEventListener('focus', () => {
    update();
  });

  document.addEventListener('DOMContentLoaded', () => {
    setStatus('human', 'Move naturally to stay human', 0);
    setTimeout(update, 2500);
  });
})();