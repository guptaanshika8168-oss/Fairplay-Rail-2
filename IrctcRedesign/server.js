const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory bot-session store
const botSessions = new Map();

// Mock train database
const TRAINS = [
  {
    id: '12951',
    name: 'Mumbai Rajdhani',
    from: 'NDLS',
    to: 'CSTM',
    departs: '16:55',
    arrives: '10:35',
    durationHrs: 17,
    durationMins: 40,
    days: 'Daily',
    type: 'Rajdhani',
    avl: { SL: 42, '3A': 0, '2A': 'RAC 3', '1A': 5 },
    fare: { SL: 945, '3A': 2455, '2A': 3520, '1A': 5880 },
    arrivesNextDay: true,
  },
  {
    id: '12615',
    name: 'Grand Trunk Express',
    from: 'NDLS',
    to: 'CSTM',
    departs: '06:30',
    arrives: '00:10',
    durationHrs: 17,
    durationMins: 40,
    days: 'Daily',
    type: 'Express',
    avl: { SL: 12, '3A': 7, '2A': 2, '1A': 0 },
    fare: { SL: 780, '3A': 2100, '2A': 3100, '1A': 5200 },
    arrivesNextDay: true,
  },
  {
    id: '22109',
    name: 'Lokmanya Tilak Express',
    from: 'NDLS',
    to: 'LTT',
    departs: '23:00',
    arrives: '22:00',
    durationHrs: 23,
    durationMins: 0,
    days: 'Mon, Wed, Fri',
    type: 'Express',
    avl: { SL: 0, '3A': 15, '2A': 8, '1A': 0 },
    fare: { SL: 870, '3A': 2300, '2A': 3400, '1A': 5600 },
    arrivesNextDay: true,
  },
  {
    id: '12137',
    name: 'Punjab Mail',
    from: 'NDLS',
    to: 'CSTM',
    departs: '20:10',
    arrives: '19:45',
    durationHrs: 23,
    durationMins: 35,
    days: 'Daily',
    type: 'Mail',
    avl: { SL: 78, '3A': 24, '2A': 10, '1A': 3 },
    fare: { SL: 735, '3A': 1980, '2A': 2900, '1A': 4800 },
    arrivesNextDay: true,
  },
  {
    id: '12263',
    name: 'Pune Duronto Express',
    from: 'NDLS',
    to: 'PUNE',
    departs: '22:30',
    arrives: '14:05',
    durationHrs: 15,
    durationMins: 35,
    days: 'Mon, Thu, Sat',
    type: 'Rajdhani',
    avl: { SL: 0, '3A': 3, '2A': 1, '1A': 0 },
    fare: { SL: 1100, '3A': 2800, '2A': 4100, '1A': 6800 },
    arrivesNextDay: true,
  },
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'railguard-irctc-secret-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 6 * 60 * 60 * 1000 },
}));

// Initialize bot session
function initSession(ip) {
  return {
    id: uuidv4().slice(0, 8),
    ip,
    score: 0,
    status: 'human',
    signals: [],
    currentPage: '/',
    honeypotTriggered: false,
    scrollSpeedMs: null,
    keystrokeScore: 0,
    hoverScore: 0,
    mouseLinear: false,
    captchaFailures: 0,
    startTime: Date.now(),
    lastSeen: Date.now(),
    booking: null,
  };
}

// Attach session to every request
app.use((req, _res, next) => {
  if (!req.session.botSessionId) {
    const s = initSession(req.ip || '127.0.0.1');
    req.session.botSessionId = s.id;
    botSessions.set(s.id, s);
  }
  const s = botSessions.get(req.session.botSessionId);
  if (s) s.lastSeen = Date.now();
  next();
});

// Recalculate bot score
function recalculate(s) {
  let score = 0;
  if (s.honeypotTriggered) score += 50;
  if (s.scrollSpeedMs !== null && s.scrollSpeedMs < 200) score += 30;
  score += Math.min(s.keystrokeScore, 40);
  score += Math.min(s.hoverScore, 20);
  if (s.mouseLinear) score += 15;
  score = Math.min(100, Math.round(score));

  if (score >= 70) s.status = 'blocked';
  else if (score >= 40) s.status = 'challenged';
  else s.status = 'human';

  s.score = score;
  return score;
}

// API: Receive bot signal
app.post('/api/signal', (req, res) => {
  const s = botSessions.get(req.session.botSessionId);
  if (!s) return res.json({ ok: false });

  const { type, data = {} } = req.body;
  s.signals.push({ type, data, ts: Date.now() });

  switch (type) {
    case 'honeypot':
      s.honeypotTriggered = true;
      break;
    case 'scroll_speed':
      s.scrollSpeedMs = data.ms;
      break;
    case 'keystroke':
      if (data.flagLevel === 2) s.keystrokeScore += 40;
      else if (data.flagLevel === 1) s.keystrokeScore += 10;
      break;
    case 'hover':
      if (data.suspicious) s.hoverScore += 30;
      break;
    case 'mouse_linear':
      if (data.linear) s.mouseLinear = true;
      break;
    case 'page':
      s.currentPage = data.page;
      break;
  }

  const score = recalculate(s);
  return res.json({ ok: true, score, status: s.status, needsChallenge: s.status === 'challenged' || s.status === 'blocked' });
});

// API: Get session
app.get('/api/session', (req, res) => {
  const s = botSessions.get(req.session.botSessionId);
  if (!s) return res.json({ score: 0, status: 'human', sessionId: 'unknown' });
  return res.json({ score: s.score, status: s.status, sessionId: s.id });
});

// API: Get trains
app.get('/api/trains', (req, res) => {
  return res.json({ trains: TRAINS });
});

// API: Book ticket
app.post('/api/book', (req, res) => {
  const s = botSessions.get(req.session.botSessionId);
  
  if (s && s.status === 'blocked') {
    return res.redirect('/blocked.html');
  }

  const { trainId, trainName, from, to, date, travelClass, contactMobile, contactEmail } = req.body;
  
  const names = [].concat(req.body.passengerName || []);
  const ages = [].concat(req.body.passengerAge || []);
  const genders = [].concat(req.body.passengerGender || []);
  const berths = [].concat(req.body.passengerBerth || []);

  const coaches = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
  const coach = coaches[Math.floor(Math.random() * coaches.length)];
  let berthNum = Math.floor(Math.random() * 60) + 1;
  const berthTypes = ['LB', 'MB', 'UB', 'SL', 'SU'];

  const passengers = names.map((name, i) => ({
    name,
    age: ages[i] || '—',
    gender: genders[i] || '—',
    berthPref: berths[i] || 'No pref',
    coach,
    berth: berthNum + i,
    berthType: berthTypes[Math.floor(Math.random() * berthTypes.length)],
    status: 'CNF',
  }));

  const train = TRAINS.find(t => t.id === trainId) || TRAINS[0];
  const farePerPax = (train.fare && train.fare[travelClass]) || 945;
  const baseFare = farePerPax * passengers.length;

  const booking = {
    pnr: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    txnId: 'TXN' + Math.random().toString(36).substring(2, 14).toUpperCase(),
    trainId: trainId || '12951',
    trainName: trainName || 'Mumbai Rajdhani',
    from: from || 'NDLS',
    to: to || 'CSTM',
    date: date || new Date().toLocaleDateString('en-IN'),
    travelClass: travelClass || 'SL',
    departs: train.departs,
    arrives: train.arrives,
    arrivesNextDay: train.arrivesNextDay,
    passengers,
    contact: { mobile: contactMobile, email: contactEmail },
    fare: {
      base: baseFare,
      reservation: 40 * passengers.length,
      gst: Math.round(baseFare * 0.05),
      total: baseFare + (40 * passengers.length) + Math.round(baseFare * 0.05),
    },
    bookedAt: new Date().toLocaleString('en-IN'),
    insurance: req.body.insurance === 'on',
  };

  if (s) s.booking = booking;
  req.session.booking = booking;

  return res.redirect('/confirmation.html');
});

// API: Get booking
app.get('/api/booking', (req, res) => {
  const s = botSessions.get(req.session.botSessionId);
  const booking = req.session.booking || (s && s.booking);
  if (!booking) return res.status(404).json({ error: 'No booking found.' });
  return res.json(booking);
});

// API: Verify CAPTCHA
app.post('/api/captcha/verify', (req, res) => {
  const s = botSessions.get(req.session.botSessionId);
  const passed = req.body.passed === 'true';

  if (!s) return res.json({ ok: false });

  if (passed) {
    s.score = Math.max(0, s.score - 35);
    s.status = s.score >= 70 ? 'blocked' : s.score >= 40 ? 'challenged' : 'human';
    return res.json({ ok: true, passed: true, newScore: s.score, status: s.status });
  } else {
    s.captchaFailures = (s.captchaFailures || 0) + 1;
    if (s.captchaFailures >= 2) {
      s.status = 'blocked';
      s.score = 100;
    }
    return res.json({
      ok: true,
      passed: false,
      failures: s.captchaFailures,
      blocked: s.status === 'blocked',
    });
  }
});

// API: Admin sessions
app.get('/api/admin/sessions', (req, res) => {
  const rows = Array.from(botSessions.values())
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 100)
    .map(s => ({
      id: s.id,
      ip: maskIP(s.ip),
      score: s.score,
      status: s.status,
      currentPage: s.currentPage,
      honeypot: s.honeypotTriggered,
      scrollSpeedMs: s.scrollSpeedMs,
      keystrokeScore: s.keystrokeScore,
      captchaFailures: s.captchaFailures,
      lastSeenAgo: Math.round((Date.now() - s.lastSeen) / 1000),
    }));

  const all = Array.from(botSessions.values());
  const stats = {
    total: all.length,
    human: all.filter(s => s.status === 'human').length,
    challenged: all.filter(s => s.status === 'challenged').length,
    blocked: all.filter(s => s.status === 'blocked').length,
  };

  const histogram = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${i * 10 + 9}`,
    count: all.filter(s => s.score >= i * 10 && s.score <= i * 10 + 9).length,
  }));

  return res.json({ rows, stats, histogram });
});

// API: Clear sessions
app.post('/api/admin/clear', (_req, res) => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  let removed = 0;
  for (const [k, s] of botSessions.entries()) {
    if (s.lastSeen < cutoff) { botSessions.delete(k); removed++; }
  }
  return res.json({ ok: true, removed, remaining: botSessions.size });
});

// Helper: Mask IP
function maskIP(ip) {
  if (!ip) return '0.0.x.x';
  const p = ip.replace('::ffff:', '').split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.x.x` : ip.slice(0, 8) + '...';
}

// Auto-purge old sessions
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, s] of botSessions.entries()) {
    if (s.lastSeen < cutoff) botSessions.delete(k);
  }
}, 10 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   🚂  RailGuard IRCTC is running         │');
  console.log(`│   App:    http://localhost:${PORT}          │`);
  console.log(`│   Admin:  http://localhost:${PORT}/admin.html│`);
  console.log('└─────────────────────────────────────────┘\n');
});