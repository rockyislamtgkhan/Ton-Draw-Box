const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ Admin panel password protect
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

// ✅ Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ✅ Withdraw requests
app.get('/withdraw-requests', (req, res) => {
  try {
    const data = fs.readFileSync('withdraw-requests.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read withdraw requests.' });
  }
});

// ✅ Balance data
app.get('/balances.json', (req, res) => {
  try {
    const data = fs.readFileSync('balances.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read balances.' });
  }
});

// ✅ Withdraw POST route with balance check and deduction
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;
  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const balancesPath = path.join(__dirname, 'balances.json');
  const withdrawPath = path.join(__dirname, 'withdraw-requests.json');

  try {
    let balances = {};
    if (fs.existsSync(balancesPath)) {
      balances = JSON.parse(fs.readFileSync(balancesPath, 'utf-8'));
    }

    if (!balances[userId] || balances[userId] < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Deduct balance
    balances[userId] -= amount;
    fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));

    // Save withdraw request
    let requests = [];
    if (fs.existsSync(withdrawPath)) {
      requests = JSON.parse(fs.readFileSync(withdrawPath, 'utf-8'));
    }

    requests.push({
      userId,
      username,
      wallet,
      amount,
      time: new Date().toISOString()
    });

    fs.writeFileSync(withdrawPath, JSON.stringify(requests, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Draw Result API
app.get('/draw-result', (req, res) => {
  try {
    const balancesPath = path.join(__dirname, 'balances.json');
    const balances = JSON.parse(fs.readFileSync(balancesPath));

    let prizePool = 0;
    for (let id in balances) {
      prizePool += parseFloat(balances[id]);
    }

    const users = Object.keys(balances);
    if (users.length === 0) {
      return res.status(400).json({ error: "No participants yet." });
    }

    const winningBox = Math.floor(Math.random() * 6) + 1;
    const winners = users.filter((_, idx) => Math.random() > 0.5);
    const prize = parseFloat((prizePool * 0.8 / Math.max(winners.length, 1)).toFixed(2));

    res.json({
      winningBox,
      winners,
      prize
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Draw result generation failed' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
