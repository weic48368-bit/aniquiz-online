const socket = io();
const $ = (id) => document.getElementById(id);
const screens = ["homeScreen", "lobbyScreen", "gameScreen", "finishScreen"];
const letters = ["A", "B", "C", "D"];
let roomCode = null;
let isHost = false;
let roomState = null;
let timerInterval = null;
let hasAnswered = false;
let currentQuestion = null;
let toastTimer = null;

function showScreen(id) {
  screens.forEach((screen) => $(screen).classList.toggle("active", screen === id));
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function setConnection(online) {
  $("connectionDot").className = "connection-dot " + (online ? "online" : "offline");
  $("connectionText").textContent = online ? "已連線" : "連線中斷";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function emitWithAck(event, payload) {
  return new Promise((resolve) => {
    socket.timeout(5000).emit(event, payload, (err, response) => {
      if (err) resolve({ ok: false, message: "連線逾時，請再試一次。" });
      else resolve(response || { ok: false, message: "伺服器沒有回應。" });
    });
  });
}

function getName() {
  return $("playerName").value.trim().slice(0, 16);
}

async function createRoom() {
  const name = getName();
  if (!name) return toast("先幫自己取個暱稱吧！");
  const result = await emitWithAck("createRoom", { name });
  if (!result.ok) return toast(result.message);
  roomCode = result.roomCode;
  isHost = true;
  $("roomCodeDisplay").textContent = roomCode;
  showScreen("lobbyScreen");
}

async function joinRoom() {
  const name = getName();
  const code = $("roomCodeInput").value.trim().toUpperCase();
  if (!name) return toast("先輸入你的暱稱！");
  if (code.length !== 4) return toast("請輸入 4 位房間代碼。");
  const result = await emitWithAck("joinRoom", { name, roomCode: code });
  if (!result.ok) return toast(result.message);
  roomCode = result.roomCode;
  isHost = false;
  $("roomCodeDisplay").textContent = roomCode;
  showScreen("lobbyScreen");
}

function renderRoom(room) {
  roomState = room;
  roomCode = room.roomCode;
  isHost = room.hostId === socket.id;
  $("roomCodeDisplay").textContent = room.roomCode;
  $("playerCount").textContent = `${room.players.length} / 12`;
  $("playersList").innerHTML = room.players.map((player, index) => `
    <div class="player-item">
      <div class="avatar">${["✦", "★", "◆", "●"][index % 4]}</div>
      <div class="player-name">${escapeHtml(player.name)}${player.isHost ? '<span class="host-tag">房主</span>' : ""}</div>
    </div>
  `).join("");
  $("startButton").classList.toggle("hidden", !isHost);
  $("hostHint").textContent = isHost ? "你是房主，準備好就開始吧！" : "等待房主開始遊戲...";
  if (room.state === "lobby" && $("lobbyScreen").classList.contains("active")) {
    showScreen("lobbyScreen");
  }
  if ($("gameScreen").classList.contains("active")) renderScoreStrip(room.players);
  if ($("finishScreen").classList.contains("active")) renderFinalRanking(room.players);
}

function renderScoreStrip(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  $("scoreStrip").innerHTML = sorted.map((p, i) => `
    <div class="score-chip">${i === 0 ? "👑 " : ""}${escapeHtml(p.name)}<strong>${p.score}</strong></div>
  `).join("");
}

function renderQuestion(data) {
  currentQuestion = data;
  hasAnswered = false;
  clearInterval(timerInterval);
  $("revealPanel").classList.add("hidden");
  $("questionNumber").textContent = `第 ${data.index} / ${data.total} 題`;
  $("progressFill").style.width = `${(data.index / data.total) * 100}%`;
  $("questionText").textContent = data.question;
  $("answerStatus").textContent = "選出你認為正確的答案！";
  $("answerGrid").innerHTML = data.options.map((option, index) => `
    <button class="answer-button" data-index="${index}">
      <span class="answer-letter">${letters[index]}</span><span>${escapeHtml(option)}</span>
    </button>
  `).join("");
  [...$("answerGrid").querySelectorAll("button")].forEach((button) => {
    button.addEventListener("click", () => submitAnswer(Number(button.dataset.index)));
  });
  $("answerProgress").textContent = `0 / ${roomState?.players?.length || 0} 人已作答`;
  startTimer(data.endsAt);
  showScreen("gameScreen");
}

function startTimer(endsAt) {
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    $("timerValue").textContent = remaining;
    $("timerRing").classList.toggle("urgent", remaining <= 5);
    if (remaining <= 0) clearInterval(timerInterval);
  };
  tick();
  timerInterval = setInterval(tick, 200);
}

async function submitAnswer(index) {
  if (hasAnswered) return;
  hasAnswered = true;
  [...$("answerGrid").querySelectorAll("button")].forEach((button) => {
    button.disabled = true;
    if (Number(button.dataset.index) === index) button.classList.add("selected");
  });
  $("answerStatus").textContent = "答案已送出！等待其他玩家...";
  const result = await emitWithAck("submitAnswer", { roomCode, answerIndex: index });
  if (!result.ok) {
    hasAnswered = false;
    toast(result.message);
  }
}

function renderReveal(data) {
  clearInterval(timerInterval);
  $("timerValue").textContent = "✓";
  $("answerStatus").textContent = "本題作答結束！";
  const buttons = [...$("answerGrid").querySelectorAll("button")];
  buttons.forEach((button) => {
    button.disabled = true;
    const index = Number(button.dataset.index);
    if (index === data.correctIndex) button.classList.add("correct");
    else if (button.classList.contains("selected")) button.classList.add("wrong");
  });
  $("revealHeading").textContent = "✦ 正確答案：" + letters[data.correctIndex];
  $("explanationText").textContent = data.explanation;
  $("resultList").innerHTML = data.results
    .sort((a, b) => b.score - a.score)
    .map((result) => `
      <div class="result-row">
        <span>${escapeHtml(result.name)}</span>
        <span class="result-mark ${result.correct ? "" : "missed"}">${result.correct ? "答對 +10" : (result.selected === null ? "未作答" : "答錯")} · ${result.score} 分</span>
      </div>
    `).join("");
  $("nextButton").classList.toggle("hidden", !isHost);
  $("waitHostHint").classList.toggle("hidden", isHost);
  $("revealPanel").classList.remove("hidden");
  $("revealPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderFinalRanking(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];
  $("finalRanking").innerHTML = sorted.map((player, index) => `
    <div class="rank-row">
      <span class="rank-medal">${medals[index] || (index + 1)}</span>
      <span class="rank-name">${escapeHtml(player.name)}${player.id === socket.id ? "（你）" : ""}</span>
      <span class="rank-score">${player.score} 分</span>
    </div>
  `).join("");
  $("restartButton").classList.toggle("hidden", !isHost);
  $("finishWaitHint").classList.toggle("hidden", isHost);
}

async function leaveRoom() {
  if (roomCode) socket.emit("leaveRoom", { roomCode });
  roomCode = null;
  roomState = null;
  isHost = false;
  hasAnswered = false;
  clearInterval(timerInterval);
  showScreen("homeScreen");
}

$("createButton").addEventListener("click", createRoom);
$("joinButton").addEventListener("click", joinRoom);
$("roomCodeInput").addEventListener("input", (event) => {
  event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
});
$("startButton").addEventListener("click", async () => {
  const result = await emitWithAck("startGame", { roomCode });
  if (!result.ok) toast(result.message);
});
$("copyCodeButton").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(roomCode);
    toast("房號已複製！");
  } catch {
    toast("你的房號是 " + roomCode);
  }
});
$("leaveButton").addEventListener("click", leaveRoom);
$("finishLeaveButton").addEventListener("click", leaveRoom);
$("nextButton").addEventListener("click", async () => {
  const result = await emitWithAck("nextQuestion", { roomCode });
  if (!result.ok) toast(result.message);
});
$("restartButton").addEventListener("click", async () => {
  const result = await emitWithAck("restartGame", { roomCode });
  if (!result.ok) toast(result.message);
});

socket.on("connect", () => setConnection(true));
socket.on("disconnect", () => setConnection(false));
socket.on("connect_error", () => setConnection(false));
socket.on("roomUpdate", renderRoom);
socket.on("newQuestion", renderQuestion);
socket.on("answerProgress", (data) => {
  $("answerProgress").textContent = `${data.answered} / ${data.total} 人已作答`;
});
socket.on("answerReveal", renderReveal);
socket.on("gameFinished", (data) => {
  clearInterval(timerInterval);
  renderFinalRanking(data.players);
  showScreen("finishScreen");
});
socket.on("roomClosed", () => {
  toast("房間已結束。");
  leaveRoom();
});
