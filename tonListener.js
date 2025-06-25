const axios = require('axios');
const fs = require('fs');

const WALLET_ADDRESS = "UQDPCzsr3SEjPT24JTrwB80v55quJPUNUmqvyADtPfPm8tNv";
const INTERVAL = 10000;
const BALANCE_FILE = 'balances.json';

let lastTxHash = null;

if (!fs.existsSync(BALANCE_FILE)) {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify({}));
}

function getBalances() {
  return JSON.parse(fs.readFileSync(BALANCE_FILE));
}

function saveBalances(data) {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify(data, null, 2));
}

async function checkTransactions() {
  try {
    const res = await axios.get(`https://tonapi.io/v2/blockchain/accounts/${WALLET_ADDRESS}/transactions`, {
      headers: { Authorization: '' }
    });

    const txs = res.data.transactions || [];
    for (const tx of txs) {
      if (!tx.incoming || !tx.amount || !tx.hash) continue;
      if (tx.hash === lastTxHash) break;

      const sender = tx.incoming.source || "unknown";
      const amount = parseFloat(tx.amount) / 1e9;

      let balances = getBalances();
      if (!balances[sender]) balances[sender] = 0;
      balances[sender] += amount;
      saveBalances(balances);

      console.log(`+ ${amount} TON from ${sender}`);
    }

    if (txs.length > 0) {
      lastTxHash = txs[0].hash;
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

console.log("🔁 Listening for deposits...");
setInterval(checkTransactions, INTERVAL);