const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ Withdraw JSON file path
const withdrawFile = path.join(__dirname, 'withdraws.json');
let withdrawRequests = [];

// ✅ If file exists, load data; otherwise initialize
if (fs.existsSync(withdrawFile)) {
  withdrawRequests = JSON.parse(fs.readFileSync(withdrawFile));
} else {
  withdrawRequests = [];
}

// ✅ Admin panel password protect
const adminUsername = 'admin'; // Change korle mone rakhbe
const adminPassword = 'drawbox123'; // Change korle mone rakhbe

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

// ✅ Serve Admin Panel HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ✅ Withdraw POST route
app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;

  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  const request = {
    userId,
    username,
    wallet,
    amount,
    time: new Date().toISOString()
  };

  withdrawRequests.push(request);

  // Save to file
  fs.writeFileSync(withdrawFile, JSON.stringify(withdrawRequests, null, 2));

  res.json({ success: true });
});

// ✅ Withdraw requests fetch route
app.get('/withdraw-requests', (req, res) => {
  res.json(withdrawRequests);
});

// ✅ Server start
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
