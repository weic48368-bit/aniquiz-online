const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const QUESTION_SECONDS = 20;

app.use(express.static(path.join(__dirname, "public")));

const QUESTION_BANK = [
  {
    question: "《火影忍者》的主角是哪一位？",
    options: ["宇智波佐助", "漩渦鳴人", "春野櫻", "旗木卡卡西"],
    answer: 1,
    explanation: "漩渦鳴人是故事的主角，夢想是成為火影。"
  },
  {
    question: "《海賊王》中，魯夫最想成為什麼？",
    options: ["海軍元帥", "世界第一劍士", "海賊王", "最有錢的人"],
    answer: 2,
    explanation: "魯夫的夢想是找到 One Piece，成為海賊王。"
  },
  {
    question: "《鬼滅之刃》中，竈門禰豆子是炭治郎的誰？",
    options: ["妹妹", "姐姐", "朋友", "表妹"],
    answer: 0,
    explanation: "禰豆子是竈門炭治郎的妹妹。"
  },
  {
    question: "《SPY×FAMILY 間諜家家酒》中，安妮亞有什麼能力？",
    options: ["預知未來", "讀心術", "隱形", "瞬間移動"],
    answer: 1,
    explanation: "安妮亞能讀取他人的心聲。"
  },
  {
    question: "《排球少年！！》中，日向翔陽主要參加哪一種運動？",
    options: ["籃球", "足球", "排球", "網球"],
    answer: 2,
    explanation: "日向翔陽加入烏野高中排球隊。"
  },
  {
    question: "《咒術迴戰》的主角是哪一位？",
    options: ["五條悟", "伏黑惠", "虎杖悠仁", "乙骨憂太"],
    answer: 2,
    explanation: "虎杖悠仁吞下宿儺手指後，進入咒術師的世界。"
  },
  {
    question: "《名偵探柯南》中，江戶川柯南原本是誰？",
    options: ["工藤新一", "服部平次", "怪盜基德", "阿笠博士"],
    answer: 0,
    explanation: "柯南的真實身分是高中生偵探工藤新一。"
  },
  {
    question: "《我的英雄學院》中，綠谷出久常被稱為什麼？",
    options: ["爆豪", "小英雄", "Deku", "歐爾麥特"],
    answer: 2,
    explanation: "Deku 是綠谷出久使用的英雄名。"
  },
  {
    question: "《死亡筆記本》中，寫上名字會發生什麼事？",
    options: ["得到超能力", "名字所屬的人會死亡", "忘記記憶", "變成死神"],
    answer: 1,
    explanation: "死亡筆記本具有讓被寫上名字的人死亡的能力。"
  },
  {
    question: "《美少女戰士》的主角月野兔，變身後的名字是？",
    options: ["水手火星", "水手木星", "水手金星", "水手月亮"],
    answer: 3,
    explanation: "月野兔變身後是水手月亮。"
  },
  {
    question: "《進擊的巨人》中，人類最初主要住在哪裡？",
    options: ["海底城市", "高牆內", "天空島", "地下王國"],
    answer: 1,
    explanation: "故事中的人類生活在三道高牆之內。"
  },
  {
    question: "《七龍珠》中，孫悟空最具代表性的招式之一是？",
    options: ["螺旋丸", "龜派氣功", "月牙天衝", "千鳥"],
    answer: 1,
    explanation: "龜派氣功是《七龍珠》中非常有代表性的招式。"
  },
  {
    question: "《灌籃高手》中，櫻木花道加入哪一支球隊？",
    options: ["陵南", "海南", "湘北", "翔陽"],
    answer: 2,
    explanation: "櫻木花道加入湘北高中籃球隊。"
  },
  {
    question: "《鏈鋸人》中，淀治最初與誰一起生活？",
    options: ["帕瓦", "早川秋", "波奇塔", "真紀真"],
    answer: 2,
    explanation: "淀治最初與鏈鋸惡魔波奇塔一起生活。"
  },
  {
    question: "《寶可夢》中，小智最具代表性的夥伴是哪一隻？",
    options: ["妙蛙種子", "皮卡丘", "傑尼龜", "小火龍"],
    answer: 1,
    explanation: "皮卡丘是小智最具代表性的寶可夢夥伴。"
  }
];

const rooms = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function publicRoom(room) {
  return {
    roomCode: room.code,
    hostId: room.hostId,
    state: room.state,
    players: [...room.players.entries()].map(([id, player]) => ({
      id,
      name: player.name,
      score: player.score,
      isHost: id === room.hostId
    }))
  };
}

function emitRoom(room) {
  io.to(room.code).emit("roomUpdate", publicRoom(room));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function playerInRoom(socket, roomCode) {
  const room = rooms.get(String(roomCode || "").toUpperCase());
  if (!room || !room.players.has(socket.id)) return null;
  return room;
}

function sendQuestion(room) {
  clearTimeout(room.timer);
  room.answers = new Map();
  room.phase = "question";
  const question = room.questions[room.questionIndex];
  const endsAt = Date.now() + QUESTION_SECONDS * 1000;

  io.to(room.code).emit("newQuestion", {
    question: question.question,
    options: question.options,
    index: room.questionIndex + 1,
    total: room.questions.length,
    duration: QUESTION_SECONDS,
    endsAt
  });

  room.timer = setTimeout(() => revealAnswer(room), QUESTION_SECONDS * 1000);
}

function revealAnswer(room) {
  if (!rooms.has(room.code) || room.phase !== "question") return;
  clearTimeout(room.timer);
  room.phase = "reveal";

  const question = room.questions[room.questionIndex];
  const results = [];

  for (const [id, player] of room.players.entries()) {
    const selected = room.answers.get(id);
    const correct = selected === question.answer;
    if (correct) player.score += 10;
    results.push({
      id,
      name: player.name,
      selected: selected === undefined ? null : selected,
      correct,
      score: player.score
    });
  }

  io.to(room.code).emit("answerReveal", {
    correctIndex: question.answer,
    explanation: question.explanation,
    results,
    players: publicRoom(room).players
  });
  emitRoom(room);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name } = {}, callback = () => {}) => {
    const cleanName = String(name || "").trim().slice(0, 16);
    if (!cleanName) return callback({ ok: false, message: "請先輸入暱稱。" });

    const code = makeCode();
    const room = {
      code,
      hostId: socket.id,
      players: new Map([[socket.id, { name: cleanName, score: 0 }]]),
      state: "lobby",
      phase: "lobby",
      questions: [],
      questionIndex: 0,
      answers: new Map(),
      timer: null
    };
    rooms.set(code, room);
    socket.join(code);
    callback({ ok: true, roomCode: code, isHost: true });
    emitRoom(room);
  });

  socket.on("joinRoom", ({ roomCode, name } = {}, callback = () => {}) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const cleanName = String(name || "").trim().slice(0, 16);
    const room = rooms.get(code);

    if (!cleanName) return callback({ ok: false, message: "請先輸入暱稱。" });
    if (!room) return callback({ ok: false, message: "找不到這個房間，請確認房號。" });
    if (room.state !== "lobby") return callback({ ok: false, message: "遊戲已經開始，暫時不能加入。" });
    if (room.players.size >= 12) return callback({ ok: false, message: "房間已滿，最多 12 位玩家。" });

    room.players.set(socket.id, { name: cleanName, score: 0 });
    socket.join(code);
    callback({ ok: true, roomCode: code, isHost: false });
    emitRoom(room);
  });

  socket.on("startGame", ({ roomCode } = {}, callback = () => {}) => {
    const room = playerInRoom(socket, roomCode);
    if (!room) return callback({ ok: false, message: "你不在這個房間裡。" });
    if (room.hostId !== socket.id) return callback({ ok: false, message: "只有房主可以開始遊戲。" });
    if (room.state !== "lobby") return callback({ ok: false, message: "遊戲已經開始。" });

    room.state = "playing";
    room.questions = shuffle(QUESTION_BANK).slice(0, 10);
    room.questionIndex = 0;
    for (const player of room.players.values()) player.score = 0;
    callback({ ok: true });
    emitRoom(room);
    sendQuestion(room);
  });

  socket.on("submitAnswer", ({ roomCode, answerIndex } = {}, callback = () => {}) => {
    const room = playerInRoom(socket, roomCode);
    if (!room || room.state !== "playing" || room.phase !== "question") {
      return callback({ ok: false, message: "目前不能作答。" });
    }
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      return callback({ ok: false, message: "答案格式不正確。" });
    }
    if (room.answers.has(socket.id)) {
      return callback({ ok: false, message: "你已經回答過這題了。" });
    }

    room.answers.set(socket.id, answerIndex);
    callback({ ok: true });
    io.to(room.code).emit("answerProgress", {
      answered: room.answers.size,
      total: room.players.size
    });

    if (room.answers.size >= room.players.size) revealAnswer(room);
  });

  socket.on("nextQuestion", ({ roomCode } = {}, callback = () => {}) => {
    const room = playerInRoom(socket, roomCode);
    if (!room) return callback({ ok: false, message: "你不在這個房間裡。" });
    if (room.hostId !== socket.id) return callback({ ok: false, message: "只有房主可以進入下一題。" });
    if (room.phase !== "reveal") return callback({ ok: false, message: "請先等這題結束。" });

    if (room.questionIndex + 1 >= room.questions.length) {
      room.state = "finished";
      room.phase = "finished";
      io.to(room.code).emit("gameFinished", {
        players: publicRoom(room).players
      });
      emitRoom(room);
    } else {
      room.questionIndex += 1;
      sendQuestion(room);
    }
    callback({ ok: true });
  });

  socket.on("restartGame", ({ roomCode } = {}, callback = () => {}) => {
    const room = playerInRoom(socket, roomCode);
    if (!room) return callback({ ok: false, message: "你不在這個房間裡。" });
    if (room.hostId !== socket.id) return callback({ ok: false, message: "只有房主可以重新開始。" });

    clearTimeout(room.timer);
    room.state = "playing";
    room.phase = "question";
    room.questions = shuffle(QUESTION_BANK).slice(0, 10);
    room.questionIndex = 0;
    room.answers = new Map();
    for (const player of room.players.values()) player.score = 0;
    callback({ ok: true });
    emitRoom(room);
    sendQuestion(room);
  });

  socket.on("leaveRoom", ({ roomCode } = {}) => {
    const code = String(roomCode || "").toUpperCase();
    const room = playerInRoom(socket, code);
    if (!room) return;
    socket.leave(code);
    removePlayer(room, socket.id);
  });

  function removePlayer(room, id) {
    room.players.delete(id);
    room.answers.delete(id);
    if (room.players.size === 0) {
      clearTimeout(room.timer);
      rooms.delete(room.code);
      return;
    }
    if (room.hostId === id) room.hostId = room.players.keys().next().value;
    emitRoom(room);
    if (room.state === "playing" && room.phase === "question" &&
        room.answers.size >= room.players.size) {
      revealAnswer(room);
    }
  }

  socket.on("disconnect", () => {
    for (const room of rooms.values()) {
      if (room.players.has(socket.id)) removePlayer(room, socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`AniQuiz is running on port ${PORT}`);
});
