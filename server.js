
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // to serve admin.html

const withdrawFile = path.join(__dirname, 'data', 'withdraws.json');

// Ensure file exists
if (!fs.existsSync(withdrawFile)) fs.writeFileSync(withdrawFile, '[]');

app.post('/withdraw', (req, res) => {
  const { userId, username, wallet, amount } = req.body;
  if (!userId || !wallet || !amount) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  const existing = JSON.parse(fs.readFileSync(withdrawFile));
  existing.push({ userId, username, wallet, amount, time: new Date().toISOString() });
  fs.writeFileSync(withdrawFile, JSON.stringify(existing, null, 2));

  res.json({ success: true });
});

app.get('/withdraw-requests', (req, res) => {
  const data = fs.existsSync(withdrawFile)
    ? JSON.parse(fs.readFileSync(withdrawFile))
    : [];
  res.json(data);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
