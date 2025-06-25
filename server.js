const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Withdraw file path
const withdrawFile = path.join(__dirname, 'data', 'withdraw.json');

// Handle POST Withdraw Request
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

// Admin panel to get withdraw list
app.get('/withdraw-requests', (req, res) => {
  if (fs.existsSync(withdrawFile)) {
    const data = fs.readFileSync(withdrawFile);
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

// Serve Admin Panel (if you have admin.html in root)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});