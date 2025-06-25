const popup = document.getElementById('popup');
let userBalance = 0.00;
let prizePool = 0.00;
let userWallet = "";
const OWNER_WALLET = "UQDPCzsr3SEjPT24JTrwB80v55quJPUNUmqvyADtPfPm8tNv";

function update() {
  document.getElementById('balance').textContent = userBalance.toFixed(2) + " TON";
  document.getElementById('prize').textContent = prizePool.toFixed(2) + " TON";
  localStorage.setItem('balance', userBalance);
}

async function fetchRealBalance() {
  const userId = Telegram.WebApp.initDataUnsafe?.user?.id;
  if (!userId) return;
  try {
    const res = await fetch("https://yourdomain.com/balances.json");
    const data = await res.json();
    if (data[userId]) {
      userBalance = parseFloat(data[userId]);
      update();
    }
  } catch (e) {
    console.error("Failed to fetch balance:", e);
  }
}

function showPopup(content) {
  popup.innerHTML = content + `<br><button class='btn btn-close' onclick='closePopup()'>❌ Close</button>`;
  popup.style.display = 'block';
}

function closePopup() {
  popup.style.display = 'none';
}

function buyBox(num) {
  if (userBalance >= 0.2) {
    userBalance -= 0.2;
    prizePool += 0.2;
    alert(`✅ Joined Box ${num}`);
  } else {
    showPopup("❌ Insufficient Balance!");
  }
  update();
}

function deposit() {
  const user = Telegram.WebApp.initDataUnsafe?.user;
  if (!user) return alert("User info not loaded.");

  const userId = user.id;
  showPopup(`
    <h3>Select Deposit</h3>
    <button class='btn' onclick='openTON(1, ${userId})'>🪙 1 TON</button>
    <button class='btn' onclick='openTON(2, ${userId})'>🪙 2 TON</button>
    <button class='btn' onclick='openTON(5, ${userId})'>🪙 5 TON</button>
    <button class='btn' onclick='openTON(10, ${userId})'>🪙 10 TON</button>
  `);
}

function openTON(amount, userId) {
  const comment = `UID${userId}_AMT${amount}`;
  const url = `https://tonkeeper.com/transfer/${OWNER_WALLET}?amount=${amount}&text=${comment}`;
  window.open(url, "_blank");
  closePopup();
}

function withdraw() {
  if (!userWallet) {
    showPopup(`
      <h3>Enter Wallet</h3>
      <input id='walletInput' placeholder='EQ...' style='width:100%; padding:8px;'>
      <br><br><button class='btn' onclick='setWallet()'>Set Wallet</button>
    `);
  } else {
    showPopup(`
      <h3>Withdraw Amount</h3>
      <button class='btn' onclick='requestWithdraw(1)'>1 TON</button>
      <button class='btn' onclick='requestWithdraw(2)'>2 TON</button>
      <button class='btn' onclick='requestWithdraw(5)'>5 TON</button>
      <button class='btn' onclick='requestWithdraw(10)'>10 TON</button>
    `);
  }
}

function setWallet() {
  const input = document.getElementById('walletInput');
  if (input.value) {
    userWallet = input.value;
    withdraw();
  } else alert("Enter valid address");
}

function requestWithdraw(amount) {
  showPopup(`✅ Withdraw request of ${amount} TON to:<br><b>${userWallet}</b><br>⚠️ Payment is manual.`);
}

function invite() {
  const id = Telegram.WebApp.initDataUnsafe?.user?.id || "123456789";
  const link = `https://t.me/TonDrawBoxBot?start=${id}`;
  showPopup(`
    <h3>📨 Invite & Earn</h3>
    <p><b>Your Referral:</b><br><input style='width:100%; padding:6px;' value='${link}' readonly onclick='this.select()'></p>
    <p>Earn 0.01 TON per real invite. ❌ Fake not allowed.</p>
  `);
}

function channel() {
  window.open("https://t.me/LudoTonOfficial", "_blank");
}

window.onload = () => {
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("app").style.display = "block";

    const user = Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      document.getElementById("user-info").innerHTML = `
        <img src="${user.photo_url}" />
        <span>${user.first_name}</span>
      `;
    }

    fetchRealBalance();
    update();
  }, 2000);
};