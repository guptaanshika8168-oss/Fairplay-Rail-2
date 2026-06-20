let pageLoadTime = Date.now();

document.addEventListener('DOMContentLoaded', () => {
  pageLoadTime = Date.now();
  trackScrollSpeed();
  trackMouseMovement();
  trackHoverBehavior();
  trackKeystrokes();
  trackHoneypot();
});

function trackScrollSpeed() {
  let scrolled = false;
  window.addEventListener('scroll', () => {
    if (!scrolled) {
      scrolled = true;
      const scrollTime = Date.now() - pageLoadTime;
      if (scrollTime < 200) {
        sendSignal('scroll_speed', { ms: scrollTime });
      }
    }
  });
}

function trackMouseMovement() {
  let points = [];
  window.addEventListener('mousemove', (e) => {
    points.push({ x: e.clientX, y: e.clientY, ts: Date.now() });
    if (points.length > 10) {
      const variance = calculateVariance(points);
      if (variance < 0.5) {
        sendSignal('mouse_linear', { linear: true });
      }
      points = points.slice(-5);
    }
  });
}

function calculateVariance(points) {
  if (points.length < 2) return 1;
  const dx = points[points.length - 1].x - points[0].x;
  const dy = points[points.length - 1].y - points[0].y;
  let totalVariance = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const expectedY = points[0].y + (deltaY * (points[i].x - points[0].x) / deltaX);
    totalVariance += Math.abs(points[i].y - expectedY);
  }
  return totalVariance / (points.length - 2);
}

function trackHoverBehavior() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const start = Date.now();
      card.addEventListener('mouseleave', () => {
        const duration = Date.now() - start;
        if (duration < 100) {
          sendSignal('hover', { suspicious: true });
        }
      });
    });
  });
}

function trackKeystrokes() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"]');
  inputs.forEach(input => {
    input.addEventListener('paste', () => {
      sendSignal('keystroke', { flagLevel: 1 });
    });
  });
}

function trackHoneypot() {
  const honeypotFields = document.querySelectorAll('.hp-field');
  honeypotFields.forEach(field => {
    field.addEventListener('input', () => {
      sendSignal('honeypot', { triggered: true });
    });
  });
}
