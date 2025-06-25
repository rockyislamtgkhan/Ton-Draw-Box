const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Withdraw file path
const withdrawFile = path.join(__dirname, 'data', 'withdraw.json');

// Password protect Admin
const adminUsername = 'admin';
const adminPassword = 'drawbox123';

app.use('/admin', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication Required');
  }

  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username === adminUsername && password === adminPassword) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Access Denied');
});

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Save withdraw request
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;
  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false });
  }

  const existing = fs.existsSync(withdrawFile)
    ? JSON.parse(fs.readFileSync(withdrawFile))
    : [];

  existing.push({ userId, username, wallet, amount, time: new Date().toISOString() });

  fs.mkdirSync(path.dirname(withdrawFile), { recursive: true });
  fs.writeFileSync(withdrawFile, JSON.stringify(existing, null, 2));

  res.json({ success: true });
});

// Return withdraw list
app.get('/withdraw-requests', (req, res) => {
  if (fs.existsSync(withdrawFile)) {
    const data = fs.readFileSync(withdrawFile);
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
