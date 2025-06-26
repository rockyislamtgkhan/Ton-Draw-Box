const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const adminUsername = 'admin';
const adminPassword = 'drawbox123';

// Admin basic auth
app.use('/admin', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth.indexOf('Basic ') === -1) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication Required');
  }

  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username === adminUsername && password === adminPassword) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Access Denied');
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Withdraw request list
app.get('/withdraw-requests', (req, res) => {
  try {
    const data = fs.readFileSync('withdraw-requests.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read withdraw requests.' });
  }
});

// Balances file
app.get('/balances.json', (req, res) => {
  try {
    const data = fs.readFileSync('balances.json', 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read balances.' });
  }
});

// Withdraw POST
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;
  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const balances = JSON.parse(fs.readFileSync('balances.json', 'utf-8'));

    if (!balances[userId] || balances[userId] < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Deduct balance
    balances[userId] -= amount;
    fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));

    // Add withdraw entry
    const entry = { userId, username, wallet, amount, time: new Date().toISOString() };
    const filePath = 'withdraw-requests.json';
    let requests = [];

    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, 'utf-8');
      requests = JSON.parse(existing);
    }

    requests.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
