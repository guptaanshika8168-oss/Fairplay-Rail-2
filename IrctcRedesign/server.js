const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let currentBooking = null;

app.get('/api/session', (req, res) => {
  res.json({ sessionId: crypto.randomUUID() });
});

app.get('/api/booking', (req, res) => {
  res.json(currentBooking || {});
});

app.post('/api/booking', (req, res) => {
  currentBooking = req.body;
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});