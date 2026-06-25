(() => {
  const state = {
    moves: 0,
    distance: 0,
    lastX: null,
    lastY: null,
    clicks: 0,
    scrolls: 0,
    typing: 0,
    score: 0,
    mode: 'human'
  };

  const update = () => {
    const activity = Math.min(
      100,
      Math.round(
        (state.moves * 0.9) +
        (state.clicks * 3) +
        (state.scrolls * 2) +
        (state.typing * 1.2) +
        Math.min(25, state.distance / 40)
      )
    );

    let mode = 'human';
    if (activity < 15) mode = 'bot';
    else if (activity < 35) mode = 'suspicious';
    else mode = 'human';

    state.score = activity;
    state.mode = mode;

    if (typeof updateStatusDisplay === 'function') {
      updateStatusDisplay(
        mode,
        mode === 'human' ? 'Human activity detected' : mode === 'suspicious' ? 'Suspicious movement detected' : 'Bot-like movement detected',
        activity
      );
    }
  };

  let throttle = 0;

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - throttle < 18) return;
    throttle = now;

    state.moves += 1;
    if (state.lastX !== null) {
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.distance += Math.hypot(dx, dy);
    }
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    update();
  }, { passive: true });

  document.addEventListener('click', () => {
    state.clicks += 1;
    update();
  }, { passive: true });

  document.addEventListener('scroll', () => {
    state.scrolls += 1;
    update();
  }, { passive: true });

  document.addEventListener('keydown', () => {
    state.typing += 1;
    update();
  }, { passive: true });

  window.addEventListener('blur', () => {
    if (typeof updateStatusDisplay === 'function') {
      updateStatusDisplay('suspicious', 'Window blurred', state.score);
    }
  });
})();