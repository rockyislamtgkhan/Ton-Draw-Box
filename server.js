const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 🔐 Admin panel auth
const adminUsername = 'admin';
const adminPassword = 'drawbox123';

app.use('/admin', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth.indexOf('Basic ') === -1) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication Required');
  }
  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username === adminUsername && password === adminPassword) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Access Denied');
});

// 🔽 Admin panel HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 🧾 Get withdraw requests
app.get('/withdraw-requests', (req, res) => {
  try {
    const data = fs.readFileSync('withdraw-requests.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.status(500).json({ error: 'Failed to read withdraw requests.' });
  }
});

// 💰 Get user balances
app.get('/balances', (req, res) => {
  try {
    const data = fs.readFileSync('balances.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.status(500).json({ error: 'Failed to read balances.' });
  }
});

// ✅ ✅ ✅ REPLACED WITH UPDATED WITHDRAW ROUTE BELOW ✅ ✅ ✅
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;

  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const balancesPath = path.join(__dirname, 'balances.json');
  let balances = {};
  try {
    if (fs.existsSync(balancesPath)) {
      balances = JSON.parse(fs.readFileSync(balancesPath, 'utf-8'));
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reading balance file' });
  }

  if (!balances[userId] || balances[userId] < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" });
  }

  // ✅ Deduct balance
  balances[userId] -= amount;
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));

  // ✅ Save withdraw request
  const entry = { userId, username, wallet, amount, time: new Date().toISOString() };
  const filePath = path.join(__dirname, 'withdraw-requests.json');
  let requests = [];
  try {
    if (fs.existsSync(filePath)) {
      requests = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    requests.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving request' });
  }
});

// 🎯 Draw Result Route
app.get('/draw-result', (req, res) => {
  try {
    const balances = JSON.parse(fs.readFileSync('balances.json'));

    const prizePool = Object.values(balances).reduce((sum, val) => sum + parseFloat(val), 0);
    const winningBox = Math.floor(Math.random() * 6) + 1;

    const winners = Object.keys(balances); // All are winners (testing only)
    const totalWinners = winners.length || 1;
    const prize = (prizePool * 0.8) / totalWinners;

    res.json({
      winningBox,
      winners,
      prize: parseFloat(prize.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate draw result.' });
  }
});

// ▶️ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
