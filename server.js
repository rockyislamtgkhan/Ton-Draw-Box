const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ Admin panel password protect
const adminUsername = 'admin'; // Change korle mon rakhbe
const adminPassword = 'drawbox123'; // Change korle mon rakhbe

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

// 🔽 Example admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Baaki routes jemon withdraw, balance, etc.
app.post('/withdraw', (req, res) => {
  // ...
});

app.get('/withdraw-requests', (req, res) => {
  // ...
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
