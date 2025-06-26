const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ Admin login setup
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

// ✅ Admin HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ✅ Get withdraw requests
app.get('/withdraw-requests', (req, res) => {
  try {
    const data = fs.readFileSync('withdraw-requests.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read withdraw requests.' });
  }
});

// ✅ Get user balances
app.get('/balances', (req, res) => {
  try {
    const data = fs.readFileSync('balances.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read balances.' });
  }
});

// ✅ Handle withdraw request
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;

  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const balancesPath = path.join(__dirname, 'balances.json');
  const withdrawPath = path.join(__dirname, 'withdraw-requests.json');

  try {
    // Read balances
    const balances = fs.existsSync(balancesPath)
      ? JSON.parse(fs.readFileSync(balancesPath, 'utf-8'))
      : {};

    if (!balances[userId] || balances[userId] < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Deduct amount
    balances[userId] -= amount;
    fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));

    // Save withdraw request
    const requests = fs.existsSync(withdrawPath)
      ? JSON.parse(fs.readFileSync(withdrawPath, 'utf-8'))
      : [];

    requests.push({ userId, username, wallet, amount, time: new Date().toISOString() });
    fs.writeFileSync(withdrawPath, JSON.stringify(requests, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
