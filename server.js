const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ✅ Middleware to parse JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// ✅ Password protect /admin
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

// ✅ Serve admin.html from root directory
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ✅ Withdraw request save to file
const withdrawFile = path.join(__dirname, 'data', 'withdraw.json');

app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;

  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false });
  }

  const existing = fs.existsSync(withdrawFile)
    ? JSON.parse(fs.readFileSync(withdrawFile))
    : [];

  existing.push({ userId, username, wallet, amount, time: new Date().toISOString() });

  fs.writeFileSync(withdrawFile, JSON.stringify(existing, null, 2));

  res.json({ success: true });
});

// ✅ Admin gets all withdraw requests
app.get('/withdraw-requests', (req, res) => {
  if (fs.existsSync(withdrawFile)) {
    const data = fs.readFileSync(withdrawFile);
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
