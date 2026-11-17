const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const QUESTION_SECONDS = 20;
const MAX_PLAYERS = 12;
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 50;

app.use(express.static(path.join(__dirname, "public")));

const ANIME_CATALOG = [
  { id: "blue-box", title: "青之箱", year: 2024 },
  { id: "fragrant-flower", title: "薰香花朵凜然綻放", year: 2025 },
  { id: "danger-in-my-heart", title: "我內心的糟糕念頭 第二季", year: 2024 },
  { id: "sign-of-affection", title: "指尖相觸，戀戀不捨", year: 2024 },
  { id: "kimi-ni-todoke", title: "只想告訴你 第三季", year: 2024 },
  { id: "365-days", title: "結婚するって、本当ですか（365 Days to the Wedding）", year: 2024 },
  { id: "amagami-sisters", title: "結緣甘神神社", year: 2024 },
  { id: "falling-in-love", title: "Anyway, I'm Falling in Love with You", year: 2025 },
  { id: "polar-opposites", title: "相反的你和我", year: 2026 },
  { id: "tamon", title: "多聞君今どっち！？", year: 2026 },
  { id: "moonlit-dusk", title: "黃昏光影／うるわしの宵の月", year: 2026 }
];

const QUESTION_BANK = [
  // 青之箱
  { animeId: "blue-box", category: "角色與社團", question: "《青之箱》中，豬股大喜主要參加哪一項運動？", options: ["籃球", "羽球", "排球", "田徑"], answer: 1, explanation: "大喜是榮明高中羽球社的成員。" },
  { animeId: "blue-box", category: "角色與社團", question: "鹿野千夏在榮明高中主要參加哪個社團？", options: ["羽球社", "排球社", "籃球社", "游泳社"], answer: 2, explanation: "千夏是籃球社的核心成員。" },
  { animeId: "blue-box", category: "角色關係", question: "蝶野雛與大喜之間最初的重要關係是什麼？", options: ["表姊弟", "同班同學兼朋友", "羽球社學姊", "籃球社教練"], answer: 1, explanation: "雛與大喜是同學和朋友，雛也逐漸對大喜產生感情。" },
  { animeId: "blue-box", category: "劇情細節", question: "大喜每天清晨努力練習，最直接希望追上的人是誰？", options: ["兵藤將太", "笠原匡", "鹿野千夏", "針生健吾"], answer: 0, explanation: "兵藤是實力出色的羽球選手，也是大喜努力追趕的目標之一。" },

  // 薰香花朵
  { animeId: "fragrant-flower", category: "作品設定", question: "《薰香花朵凜然綻放》中，紬凜太郎就讀的男校名稱是？", options: ["桔梗女子高中", "千鳥高中", "榮明高中", "秀知院學園"], answer: 1, explanation: "凜太郎就讀千鳥高中，該校與薰子就讀的桔梗女子高中有鮮明對照。" },
  { animeId: "fragrant-flower", category: "作品設定", question: "和栗薰子就讀哪一所學校？", options: ["千鳥高中", "桔梗女子高中", "榮明高中", "櫻花高中"], answer: 1, explanation: "薰子就讀桔梗女子高中。" },
  { animeId: "fragrant-flower", category: "角色", question: "凜太郎家中經營的店主要販售什麼？", options: ["拉麵", "蛋糕與甜點", "書籍", "花束"], answer: 1, explanation: "凜太郎家裡經營蛋糕店，他也會在店裡幫忙。" },
  { animeId: "fragrant-flower", category: "角色關係", question: "凜太郎與薰子初次相遇時，薰子對凜太郎家店裡的甜點有什麼反應？", options: ["認為味道很差", "非常喜歡並成為常客", "對甜點過敏", "只想買飲料"], answer: 1, explanation: "薰子很喜歡凜太郎家店裡的甜點，這也成為兩人相識的契機。" },

  // 我內心的糟糕念頭
  { animeId: "danger-in-my-heart", category: "角色", question: "《我內心的糟糕念頭》中，市川京太郎最初常把自己沉浸在哪類幻想中？", options: ["成為職業棋士", "陰暗的中二式妄想", "成為偶像", "環遊世界"], answer: 1, explanation: "京太郎一開始有許多陰暗、誇張的中二妄想，後來逐漸敞開心房。" },
  { animeId: "danger-in-my-heart", category: "角色", question: "山田杏奈除了是京太郎的同學，也以什麼身分活動？", options: ["模特兒", "職業歌手", "漫畫家", "網球選手"], answer: 0, explanation: "山田是模特兒，常出現在時尚與雜誌相關工作中。" },
  { animeId: "danger-in-my-heart", category: "角色關係", question: "關根萌子在故事中與山田的關係較接近哪一種？", options: ["她的姊姊", "她的同學與朋友", "她的經紀人", "她的表妹"], answer: 1, explanation: "萌子是山田的同學與朋友，也是班上重要的同伴。" },
  { animeId: "danger-in-my-heart", category: "劇情細節", question: "京太郎與山田的關係逐漸拉近後，京太郎最明顯的改變是？", options: ["完全放棄上學", "開始更在意他人並努力面對自己的情感", "轉學到海外", "加入籃球校隊"], answer: 1, explanation: "與山田相處讓京太郎逐漸成長，開始理解自己與他人的感受。" },

  // 指尖相觸
  { animeId: "sign-of-affection", category: "角色", question: "《指尖相觸，戀戀不捨》的女主角糸瀨雪有哪項特徵？", options: ["聽覺障礙", "視覺障礙", "無法說話", "色盲"], answer: 0, explanation: "雪是聽覺障礙者，故事呈現她與周遭人溝通、建立關係的過程。" },
  { animeId: "sign-of-affection", category: "角色", question: "男主角波岐逸臣最明顯的生活特徵之一是？", options: ["熱愛旅行與接觸不同語言文化", "只想待在家中", "從未離開日本", "專職職業棋士"], answer: 0, explanation: "逸臣喜歡旅行，也對不同語言與文化抱持好奇。" },
  { animeId: "sign-of-affection", category: "角色關係", question: "蘆沖櫻志與雪之間的關係，最接近哪一項？", options: ["雪的童年朋友", "雪的教授", "逸臣的哥哥", "雪的表弟"], answer: 0, explanation: "櫻志是雪的青梅竹馬，對雪抱有感情。" },
  { animeId: "sign-of-affection", category: "主題", question: "作品中，手語對雪與逸臣的關係有什麼重要作用？", options: ["只是比賽規則", "成為理解彼此與溝通的重要方式", "用來破解密碼", "只在學校考試出現"], answer: 1, explanation: "手語和其他溝通方式是兩人理解彼此的重要橋樑。" },

  // 只想告訴你
  { animeId: "kimi-ni-todoke", category: "角色", question: "《只想告訴你》的女主角黑沼爽子，最初常被同學誤會像哪個恐怖角色？", options: ["貞子", "花子", "伽椰子", "富江"], answer: 0, explanation: "爽子因外貌與氣質被同學聯想到貞子，因而產生誤解。" },
  { animeId: "kimi-ni-todoke", category: "角色", question: "風早翔太在故事初期對爽子最重要的影響是？", options: ["鼓勵她與同學建立交流", "要求她轉學", "邀她加入足球隊", "教她彈鋼琴"], answer: 0, explanation: "風早自然、友善的態度，幫助爽子逐漸融入班級。" },
  { animeId: "kimi-ni-todoke", category: "角色關係", question: "矢野綾音與吉田千鶴在故事中是爽子的什麼人？", options: ["同班好友", "遠房親戚", "補習班老師", "鄰居的家長"], answer: 0, explanation: "綾音與千鶴是爽子在高中結識的重要朋友。" },
  { animeId: "kimi-ni-todoke", category: "角色", question: "真田龍最擅長、也最常被提及的運動是？", options: ["棒球", "足球", "網球", "游泳"], answer: 0, explanation: "龍是棒球選手，並且與千鶴有長久的相處關係。" },

  // 365 Days to the Wedding
  { animeId: "365-days", category: "作品設定", question: "《365 Days to the Wedding》的主要舞台與兩位主角的工作環境是？", options: ["旅行社", "醫院", "高中", "出版社"], answer: 0, explanation: "大原拓也與本城寺莉香在旅行社 JTC 工作。" },
  { animeId: "365-days", category: "角色", question: "男主角大原拓也給人的初期印象較接近哪一種？", options: ["內向、喜歡安穩生活", "外向的明星", "熱血運動員", "旅行節目主持人"], answer: 0, explanation: "拓也是偏好安靜生活、個性較內向的上班族。" },
  { animeId: "365-days", category: "劇情", question: "拓也與莉香為何開始假裝即將結婚？", options: ["為了避免被派往海外分公司", "為了參加婚禮比賽", "為了繼承學校", "為了贏得電視節目"], answer: 0, explanation: "兩人為避免被調派至西伯利亞分公司，決定假裝訂婚。" },
  { animeId: "365-days", category: "角色", question: "女主角本城寺莉香最初給人的性格印象是？", options: ["喜歡獨處、對旅行與地圖有興趣", "非常擅長格鬥", "職業歌手", "熱衷校園運動"], answer: 0, explanation: "莉香有自己的興趣與生活節奏，喜歡旅行和地圖。" },

  // 結緣甘神神社
  { animeId: "amagami-sisters", category: "作品設定", question: "《結緣甘神神社》的男主角上終瓜生，最初希望實現的目標是？", options: ["考上醫學院", "成為職業棋士", "成為神職人員", "出國當廚師"], answer: 0, explanation: "瓜生以考上京都大學醫學部為目標。" },
  { animeId: "amagami-sisters", category: "角色", question: "甘神三姊妹中，年紀最小的是誰？", options: ["甘神夕奈", "甘神夜重", "甘神朝姬", "三人同年"], answer: 2, explanation: "朝姬是三姊妹中的么妹。" },
  { animeId: "amagami-sisters", category: "角色", question: "甘神三姊妹的名字分別是？", options: ["夜重、夕奈、朝姬", "雪、花、月", "千夏、雛、菖蒲", "櫻、楓、椿"], answer: 0, explanation: "三姊妹是甘神夜重、甘神夕奈與甘神朝姬。" },
  { animeId: "amagami-sisters", category: "作品設定", question: "故事中，瓜生與甘神三姊妹共同生活的主要場所是？", options: ["甘神神社", "榮明高中宿舍", "大型百貨公司", "海外研究中心"], answer: 0, explanation: "故事圍繞甘神神社與三姊妹的生活展開。" },

  // Anyway, I'm Falling in Love with You
  { animeId: "falling-in-love", category: "角色", question: "《Anyway, I'm Falling in Love with You》的女主角是誰？", options: ["西野水帆", "糸瀨雪", "黑沼爽子", "鹿野千夏"], answer: 0, explanation: "西野水帆是故事的女主角。" },
  { animeId: "falling-in-love", category: "劇情設定", question: "故事的重要時間背景與哪個事件有關？", options: ["水帆十七歲生日與高中生活", "大學畢業典禮", "世界旅行", "職業棒球選秀"], answer: 0, explanation: "故事從水帆十七歲生日附近展開，並描寫她與青梅竹馬們的關係。" },
  { animeId: "falling-in-love", category: "角色關係", question: "水帆身邊幾位重要男性角色，主要是她的什麼人？", options: ["青梅竹馬", "大學教授", "遠房叔叔", "職場上司"], answer: 0, explanation: "故事核心是水帆與幾位青梅竹馬之間逐漸變化的關係。" },
  { animeId: "falling-in-love", category: "主題", question: "作品主要描寫哪種情感變化？", options: ["青梅竹馬間友情與戀情的轉變", "師徒競賽", "職場升遷", "偵探辦案"], answer: 0, explanation: "作品以青梅竹馬的關係變化與青春戀愛為核心。" },

  // 2026 新番
  { animeId: "polar-opposites", category: "角色", question: "《相反的你和我》的兩位主角是鈴木與誰？", options: ["谷悠介", "上終瓜生", "波岐逸臣", "豬股大喜"], answer: 0, explanation: "故事主角是活潑的鈴木美羽與較安靜的谷悠介。" },
  { animeId: "polar-opposites", category: "主題", question: "作品標題中的「相反」主要指向兩位主角的什麼差異？", options: ["性格與表達方式", "國籍與年代", "職業與年齡", "超能力種類"], answer: 0, explanation: "作品以性格反差的兩位高中生展開戀愛喜劇。" },
  { animeId: "tamon", category: "角色", question: "《多聞君今どっち！？》的女主角木下歌夏是誰的粉絲？", options: ["福原多聞", "谷悠介", "上終瓜生", "真田龍"], answer: 0, explanation: "歌夏是偶像團體 F/ACE 成員福原多聞的忠實粉絲。" },
  { animeId: "tamon", category: "作品設定", question: "福原多聞所屬的偶像團體名稱是？", options: ["F/ACE", "JTC", "千鳥", "EIMEI"], answer: 0, explanation: "多聞是偶像團體 F/ACE 的成員。" },
  { animeId: "moonlit-dusk", category: "角色", question: "《黃昏光影／うるわしの宵の月》的女主角瀧口宵，常被周遭人以什麼稱呼？", options: ["王子", "老師", "隊長", "公主"], answer: 0, explanation: "宵因外貌與氣質常被稱為「王子」。" },
  { animeId: "moonlit-dusk", category: "角色", question: "市村琥珀與瀧口宵的關係，主要從哪種情境開始發展？", options: ["同校學生間的相遇與互動", "職場同事", "童年鄰居重逢", "偵探與委託人"], answer: 0, explanation: "兩人同在高中就讀，互動逐漸發展成戀愛故事。" }
];

const COMPREHENSIVE_BANK = [
  { animeId: "comprehensive", category: "跨作品角色辨識", question: "以下哪一組角色與作品配對正確？", options: ["糸瀨雪－《指尖相觸，戀戀不捨》", "黑沼爽子－《青之箱》", "鹿野千夏－《只想告訴你》", "西野水帆－《薰香花朵凜然綻放》"], answer: 0, explanation: "糸瀨雪是《指尖相觸，戀戀不捨》的女主角。" },
  { animeId: "comprehensive", category: "跨作品設定", question: "以下哪部作品的主角組合與「羽球社男生、籃球社女生」有關？", options: ["青之箱", "只想告訴你", "指尖相觸，戀戀不捨", "結婚するって、本当ですか"], answer: 0, explanation: "《青之箱》的大喜是羽球社成員，千夏是籃球社成員。" },
  { animeId: "comprehensive", category: "跨作品設定", question: "以下哪部作品以聽覺障礙女主角與喜愛旅行的男主角為核心？", options: ["指尖相觸，戀戀不捨", "薰香花朵凜然綻放", "相反的你和我", "多聞君今どっち！？"], answer: 0, explanation: "雪與逸臣是《指尖相觸，戀戀不捨》的主角。" },
  { animeId: "comprehensive", category: "跨作品角色辨識", question: "以下哪位角色與「被稱為王子」的設定最有關？", options: ["瀧口宵", "山田杏奈", "本城寺莉香", "甘神朝姬"], answer: 0, explanation: "瀧口宵因外表與氣質被稱為王子。" },
  { animeId: "comprehensive", category: "跨作品設定", question: "以下哪部作品的戀愛關係起點與假裝訂婚有關？", options: ["365 Days to the Wedding", "青之箱", "我內心的糟糕念頭", "相反的你和我"], answer: 0, explanation: "拓也與莉香為避免外派而假裝訂婚。" },
  { animeId: "comprehensive", category: "跨作品角色辨識", question: "以下哪位男主角以考上醫學院為目標？", options: ["上終瓜生", "豬股大喜", "市川京太郎", "谷悠介"], answer: 0, explanation: "《結緣甘神神社》的上終瓜生以考上醫學院為目標。" },
  { animeId: "comprehensive", category: "跨作品設定", question: "以下哪部作品以偶像粉絲與偶像之間的互動為重要設定？", options: ["多聞君今どっち！？", "只想告訴你", "薰香花朵凜然綻放", "指尖相觸，戀戀不捨"], answer: 0, explanation: "歌夏是 F/ACE 成員福原多聞的粉絲。" },
  { animeId: "comprehensive", category: "跨作品角色辨識", question: "以下哪一組配對全部正確？", options: ["市川京太郎－山田杏奈", "豬股大喜－糸瀨雪", "谷悠介－甘神夕奈", "凜太郎－本城寺莉香"], answer: 0, explanation: "市川京太郎與山田杏奈是《我內心的糟糕念頭》的主角。" },
  { animeId: "comprehensive", category: "跨作品比較", question: "以下哪兩部作品的主要舞台都與高中生活有密切關係？", options: ["《青之箱》與《相反的你和我》", "《365 Days to the Wedding》與《指尖相觸》", "《結緣甘神神社》與《365 Days to the Wedding》", "《多聞君》與《365 Days to the Wedding》"], answer: 0, explanation: "兩部作品都以高中生的校園生活與戀愛互動為重要背景。" },
  { animeId: "comprehensive", category: "戀愛動漫知識", question: "戀愛作品中，若故事核心是角色從青梅竹馬逐漸重新理解彼此，最常見的敘事重點是哪一項？", options: ["關係變化與情感確認", "解開超自然犯罪", "爭奪世界王位", "探索外星文明"], answer: 0, explanation: "青梅竹馬戀愛故事通常著重友情、熟悉感與戀愛情感之間的變化。" },
  { animeId: "comprehensive", category: "跨作品角色辨識", question: "哪位角色是《薰香花朵凜然綻放》的男主角？", options: ["紬凜太郎", "福原多聞", "波岐逸臣", "大原拓也"], answer: 0, explanation: "紬凜太郎是作品男主角。" },
  { animeId: "comprehensive", category: "跨作品設定", question: "以下哪部作品的主角群包含甘神夜重、甘神夕奈與甘神朝姬？", options: ["結緣甘神神社", "青之箱", "只想告訴你", "多聞君今どっち！？"], answer: 0, explanation: "三人是甘神神社的三姊妹。" }
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

function getAnimeTitle(id) {
  return ANIME_CATALOG.find((item) => item.id === id)?.title || "綜合題目";
}

function getModeLabel(settings) {
  if (settings.mode === "single") return `單一作品：${getAnimeTitle(settings.selectedAnime[0])}`;
  if (settings.mode === "multi") return `多作品混合：${settings.selectedAnime.map(getAnimeTitle).join("、")}`;
  if (settings.mode === "comprehensive") return "綜合題目";
  return "全部作品隨機";
}

function publicRoom(room) {
  return {
    roomCode: room.code,
    hostId: room.hostId,
    state: room.state,
    quizSettingsLabel: getModeLabel(room.quizSettings),
    players: [...room.players.entries()].map(([id, player]) => ({
      id, name: player.name, score: player.score, isHost: id === room.hostId
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

function buildQuestionSet(settings) {
  let pool;
  if (settings.mode === "comprehensive") {
    pool = COMPREHENSIVE_BANK;
  } else if (settings.mode === "single" || settings.mode === "multi") {
    pool = QUESTION_BANK.filter((q) => settings.selectedAnime.includes(q.animeId));
  } else {
    pool = QUESTION_BANK;
  }
  const count = Math.min(settings.questionCount, pool.length);
  return shuffle(pool).slice(0, count);
}

function sendQuestion(room) {
  clearTimeout(room.timer);
  room.answers = new Map();
  room.phase = "question";
  const question = room.questions[room.questionIndex];
  const endsAt = Date.now() + QUESTION_SECONDS * 1000;
  const anime = ANIME_CATALOG.find((item) => item.id === question.animeId);

  io.to(room.code).emit("newQuestion", {
    question: question.question,
    options: question.options,
    index: room.questionIndex + 1,
    total: room.questions.length,
    duration: QUESTION_SECONDS,
    endsAt,
    animeTitle: anime ? anime.title : "綜合題目",
    category: question.category || "綜合知識"
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
      id, name: player.name,
      selected: selected === undefined ? null : selected,
      correct, score: player.score
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

function normalizeSettings(input = {}) {
  const mode = ["single", "multi", "all", "comprehensive"].includes(input.mode) ? input.mode : "all";
  const validIds = new Set(ANIME_CATALOG.map((item) => item.id));
  const selectedAnime = Array.isArray(input.selectedAnime)
    ? [...new Set(input.selectedAnime.filter((id) => validIds.has(id)))]
    : [];
  const requested = Number.parseInt(input.questionCount, 10);
  const questionCount = Number.isFinite(requested)
    ? Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, requested))
    : 10;

  if (mode === "single" && selectedAnime.length !== 1) {
    return { error: "單一作品模式請選擇一部動漫。" };
  }
  if (mode === "multi" && selectedAnime.length < 2) {
    return { error: "多作品混合模式至少選擇兩部動漫。" };
  }
  return { value: { mode, selectedAnime, questionCount } };
}

function startRoomGame(room) {
  const questions = buildQuestionSet(room.quizSettings);
  if (questions.length < MIN_QUESTIONS) {
    return { ok: false, message: `這個題庫目前只有 ${questions.length} 題，目前沒有可用題目，請更換題庫模式。` };
  }
  clearTimeout(room.timer);
  room.state = "playing";
  room.questions = questions;
  room.questionIndex = 0;
  room.answers = new Map();
  for (const player of room.players.values()) player.score = 0;
  return { ok: true };
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name, quizSettings } = {}, callback = () => {}) => {
    const cleanName = String(name || "").trim().slice(0, 16);
    if (!cleanName) return callback({ ok: false, message: "請先輸入暱稱。" });

    const normalized = normalizeSettings(quizSettings);
    if (normalized.error) return callback({ ok: false, message: normalized.error });

    const code = makeCode();
    const room = {
      code, hostId: socket.id,
      players: new Map([[socket.id, { name: cleanName, score: 0 }]]),
      state: "lobby", phase: "lobby",
      quizSettings: normalized.value,
      questions: [], questionIndex: 0, answers: new Map(), timer: null
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
    if (room.players.size >= MAX_PLAYERS) return callback({ ok: false, message: `房間已滿，最多 ${MAX_PLAYERS} 位玩家。` });

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
    const result = startRoomGame(room);
    if (!result.ok) return callback(result);
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
    if (room.answers.has(socket.id)) return callback({ ok: false, message: "你已經回答過這題了。" });

    room.answers.set(socket.id, answerIndex);
    callback({ ok: true });
    io.to(room.code).emit("answerProgress", { answered: room.answers.size, total: room.players.size });
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
      io.to(room.code).emit("gameFinished", { players: publicRoom(room).players });
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
    const result = startRoomGame(room);
    if (!result.ok) return callback(result);
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
    if (room.state === "playing" && room.phase === "question" && room.answers.size >= room.players.size) {
      revealAn
