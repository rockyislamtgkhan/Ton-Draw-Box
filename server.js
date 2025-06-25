
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Admin Panel Auth
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

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;
  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  const filePath = path.join(__dirname, 'withdraw.json');
  let existing = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    existing = JSON.parse(fileData || "[]");
  }

  existing.push({
    userId,
    username,
    wallet,
    amount,
    time: new Date().toISOString()
  });

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  res.json({ success: true });
});

app.get('/withdraw-requests', (req, res) => {
  const filePath = path.join(__dirname, 'withdraw.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
      
