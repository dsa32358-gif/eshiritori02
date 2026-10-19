// アプリの状態管理
let players = [];
let rounds = 1;
let currentTurnIndex = 0;
let totalTurns = 0;
let historyData = [];

// Canvas & ツール関連
let canvas, ctx;
let isDrawing = false;
let drawHistory = [];
let currentColor = '#000000';
let currentSize = 5;
let currentTool = 'pencil'; // 'pencil', 'bucket', 'eraser'

// 画面切り替え要素
const screens = {
  lobby: document.getElementById('screen-lobby'),
  pass: document.getElementById('screen-pass'),
  game: document.getElementById('screen-game'),
  result: document.getElementById('screen-result')
};

window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initCanvas();
});

function setupEventListeners() {
  document.getElementById('btn-add-player').addEventListener('click', addPlayer);
  document.getElementById('input-player-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
  });

  document.getElementById('btn-start-game').addEventListener('click', startGame);
  document.getElementById('btn-ready-turn').addEventListener('click', startMyTurn);
  document.getElementById('btn-submit-turn').addEventListener('click', submitTurn);
  document.getElementById('btn-back-lobby').addEventListener('click', () => location.reload());

  // カラーパレット
  document.querySelectorAll('.btn-color-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentColor = e.target.dataset.color;
      document.getElementById('color-picker').value = currentColor;
      if (currentTool === 'eraser') setTool('pencil');
    });
  });

  document.getElementById('color-picker').addEventListener('change', (e) => {
    currentColor = e.target.value;
    if (currentTool === 'eraser') setTool('pencil');
  });

  document.getElementById('brush-size').addEventListener('input', (e) => {
    currentSize = e.target.value;
  });

  // ツール切り替えボタン
  document.getElementById('btn-pencil').addEventListener('click', () => setTool('pencil'));
  document.getElementById('btn-bucket').addEventListener('click', () => setTool('bucket'));
  document.getElementById('btn-eraser').addEventListener('click', () => setTool('eraser'));

  document.getElementById('btn-undo').addEventListener('click', undoCanvas);
  document.getElementById('btn-clear').addEventListener('click', clearCanvas);
}

function setTool(toolName) {
  currentTool = toolName;
  document.getElementById('btn-pencil').classList.toggle('active-tool', toolName === 'pencil');
  document.getElementById('btn-bucket').classList.toggle('active-tool', toolName === 'bucket');
  document.getElementById('btn-eraser').classList.toggle('active-tool', toolName === 'eraser');
}

function showScreen(screenName) {
  Object.keys(screens).forEach(key => {
    screens[key].classList.remove('active');
  });
  screens[screenName].classList.add('active');
}

function addPlayer() {
  const input = document.getElementById('input-player-name');
  const name = input.value.trim();
  if (!name) return;

  if (players.includes(name)) {
    return alert('同じ名前のプレイヤーが既に存在します');
  }

  players.push(name);
  input.value = '';
  updatePlayerList();
}

function updatePlayerList() {
  const listEl = document.getElementById('setup-player-list');
  listEl.innerHTML = '';
  document.getElementById('player-count').textContent = players.length;

  players.forEach((name, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${name}`;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.textContent = '削除';
    delBtn.onclick = () => {
      players.splice(index, 1);
      updatePlayerList();
    };

    li.appendChild(delBtn);
    listEl.appendChild(li);
  });
}

function startGame() {
  if (players.length < 2) {
    return alert('最低2人以上のプレイヤーが必要です');
  }

  rounds = parseInt(document.getElementById('input-rounds').value, 10);
  totalTurns = players.length * rounds;
  currentTurnIndex = 0;
  historyData = [];

  preparePassScreen();
}

function preparePassScreen() {
  const activePlayer = players[currentTurnIndex % players.length];
  document.getElementById('next-player-name').textContent = activePlayer;
  showScreen('pass');
}

function startMyTurn() {
  showScreen('game');
  
  const activePlayer = players[currentTurnIndex % players.length];
  document.getElementById('current-player-name').textContent = activePlayer;
  document.getElementById('current-turn-num').textContent = currentTurnIndex + 1;
  document.getElementById('total-turns-num').textContent = totalTurns;

  const instructionEl = document.getElementById('canvas-instruction');
  if (currentTurnIndex === 0) {
    instructionEl.textContent = '🎨 最初のお題（最初の絵）を描こう！';
  } else {
    instructionEl.textContent = '🎨 前の絵に繋がる絵を描こう！';
  }

  setTool('pencil');
  clearCanvas();
  renderTimeline();
  resizeCanvas();
}

function submitTurn() {
  const answer = document.getElementById('input-answer').value.trim();
  if (!answer) return alert('描いたものの名前（答え）を入力してください！');

  const imageData = canvas.toDataURL('image/png');
  const activePlayer = players[currentTurnIndex % players.length];

  historyData.push({
    playerName: activePlayer,
    image: imageData,
    answer: answer
  });

  document.getElementById('input-answer').value = '';
  currentTurnIndex++;

  if (currentTurnIndex >= totalTurns) {
    showResultScreen();
  } else {
    preparePassScreen();
  }
}

function renderTimeline() {
  const container = document.getElementById('history-timeline');
  container.innerHTML = '';

  if (historyData.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999; font-size:0.85rem;">自由な絵からスタートしてね。</p>';
    return;
  }

  historyData.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';

    const img = document.createElement('img');
    img.src = item.image;

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    const author = document.createElement('div');
    author.className = 'author';
    author.textContent = `${item.playerName} さんの絵`;

    const idx = document.createElement('div');
    idx.className = 'turn-idx';
    idx.textContent = `第 ${index + 1} ターン`;

    meta.appendChild(author);
    meta.appendChild(idx);

    div.appendChild(img);
    div.appendChild(meta);
    container.appendChild(div);
  });
}

function showResultScreen() {
  showScreen('result');
  const listContainer = document.getElementById('result-list');
  listContainer.innerHTML = '';

  historyData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const img = document.createElement('img');
    img.src = item.image;

    const info = document.createElement('div');
    info.className = 'result-info';

    const player = document.createElement('div');
    player.className = 'player';
    player.textContent = `第 ${index + 1} ターン: ${item.playerName}`;

    const answer = document.createElement('div');
    answer.className = 'answer';
    answer.textContent = `答え: ${item.answer}`;

    info.appendChild(player);
    info.appendChild(answer);
    card.appendChild(img);
    card.appendChild(info);

    listContainer.appendChild(card);

    if (index < historyData.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'arrow-divider';
      arrow.textContent = '⬇';
      listContainer.appendChild(arrow);
    }
  });
}

// === キャンバス機能 & 塗りつぶしアルゴリズム ===
function initCanvas() {
  canvas = document.getElementById('paint-canvas');
  ctx = canvas.getContext('2d');

  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseup', handlePointerUp);
  canvas.addEventListener('mouseleave', handlePointerUp);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) handlePointerDown(e.touches[0]);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) handlePointerMove(e.touches[0]);
  }, { passive: false });

  canvas.addEventListener('touchend', handlePointerUp);

  saveState();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((e.clientX - rect.left) * (canvas.width / rect.width)),
    y: Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
  };
}

function handlePointerDown(e) {
  const pos = getPos(e);

  if (currentTool === 'bucket') {
    floodFill(pos.x, pos.y, currentColor);
    saveState();
  } else {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
}

function handlePointerMove(e) {
  if (!isDrawing || currentTool === 'bucket') return;
  const pos = getPos(e);

  ctx.lineWidth = currentSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (currentTool === 'eraser') {
    ctx.strokeStyle = '#ffffff';
  } else {
    ctx.strokeStyle = currentColor;
  }

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function handlePointerUp() {
  if (isDrawing) {
    isDrawing = false;
    ctx.closePath();
    saveState();
  }
}

// 塗りつぶし（フラッドフィル）アルゴリズム
function floodFill(startX, startY, hexColor) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;

  const targetRgb = hexToRgb(hexColor);
  const startPos = (startY * width + startX) * 4;

  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // 既に同じ色の場合はスキップ
  if (colorsMatch(startR, startG, startB, startA, targetRgb.r, targetRgb.g, targetRgb.b, 255)) {
    return;
  }

  const queue = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const pos = (y * width + x) * 4;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    if (colorsMatch(data[pos], data[pos + 1], data[pos + 2], data[pos + 3], startR, startG, startB, startA)) {
      data[pos] = targetRgb.r;
      data[pos + 1] = targetRgb.g;
      data[pos + 2] = targetRgb.b;
      data[pos + 3] = 255;

      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function colorsMatch(r1, g1, b1, a1, r2, g2, b2, a2) {
  // 線のアンチエイリアスによる塗りの残りを軽減するため許容誤差(10)を適用
  return Math.abs(r1 - r2) <= 10 &&
         Math.abs(g1 - g2) <= 10 &&
         Math.abs(b1 - b2) <= 10 &&
         Math.abs(a1 - a2) <= 10;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function saveState() {
  if (drawHistory.length >= 10) drawHistory.shift();
  drawHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undoCanvas() {
  if (drawHistory.length > 1) {
    drawHistory.pop();
    const previousState = drawHistory[drawHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
  } else if (drawHistory.length === 1) {
    clearCanvas();
  }
}

function clearCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawHistory = [];
  saveState();
}