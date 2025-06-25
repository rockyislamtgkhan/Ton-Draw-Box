const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = 'admin123';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Get balances
app.get('/balances.json', (req, res) => {
  fs.readFile('./balances.json', 'utf8', (err, data) => {
    if (err) return res.json({});
    res.send(data);
  });
});

// Get withdraw requests
app.get('/withdraws.json', (req, res) => {
  fs.readFile('./withdraws.json', 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.send(data);
  });
});

// Update withdraws from admin
app.post('/update-withdraws', (req, res) => {
  fs.writeFile('./withdraws.json', JSON.stringify(req.body, null, 2), () => {
    res.send({ status: 'ok' });
  });
});

// Admin Panel with password
app.get('/admin', (req, res) => {
  if (req.query.pass === ADMIN_PASS) {
    res.sendFile(__dirname + '/admin.html');
  } else {
    res.send('❌ Unauthorized');
  }
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});