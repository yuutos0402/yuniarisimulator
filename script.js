// --- 1. 変数の定義（必ずファイルの先頭に置く） ---
let deck = [];
let hand = [];
let outsideCards = []; // ★追加：場外に送ったカードのデータを保存する配列
let selectedHandIndex = null;
let canMulligan = false;
let selectedFieldSlot = null; //

// --- 2. ゲーム開始 ---
function startGame() {
  const saved = JSON.parse(localStorage.getItem("deck")) || [];
  if (saved.length === 0) return alert("デッキを作成してください");

  deck = [...saved];
  shuffle(deck);
  setupLife();

  hand = [];
  for(let i=0; i<7; i++) { if(deck.length > 0) hand.push(deck.shift()); }

  canMulligan = true;
  document.getElementById("mulligan-btn").style.display = "inline-block";
  document.getElementById("draw-btn").style.display = "inline-block";
  
  resetAP();
  updateDisplay();
}

// --- 3. ドロー機能 ---
function drawCard() {
  if (deck.length > 0) {
    hand.push(deck.shift());
    // ドローしたらマリガン不可
    canMulligan = false;
    document.getElementById("mulligan-btn").style.display = "none";
    updateDisplay();
  }
}

function moveToOutside() {
  // A. 手札が選択されている場合
  if (selectedHandIndex !== null) {
    const card = hand.splice(selectedHandIndex, 1)[0];
    outsideCards.push(card);
    selectedHandIndex = null;
  } 
  // B. フィールドのカードが選択されている場合
  else if (selectedFieldSlot !== null) {
    const img = selectedFieldSlot.querySelector("img");
    const cardData = JSON.parse(img.dataset.cardData);
    outsideCards.push(cardData);
    selectedFieldSlot.innerHTML = "";
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
  } 
  // C. 何も選択されていない場合は中身を見る
  else {
    openOutside();
    return;
  }

  // UI更新
  const outside = document.getElementById("outside-area");
  outside.style.background = "rgba(0, 229, 255, 0.2)"; 
  outside.innerText = `OUTSIDE (${outsideCards.length})`;
  updateDisplay();
}

// 場外一覧を表示する
function openOutside() {
  if (outsideCards.length === 0) return alert("場外にカードはありません");
  
  const modal = document.getElementById("outside-modal");
  const list = document.getElementById("outside-list");
  
  list.innerHTML = ""; // 一旦クリア
  outsideCards.forEach(card => {
    const img = document.createElement("img");
    img.src = card.image;
    img.style.width = "100%";
    img.style.borderRadius = "4px";
    list.appendChild(img);
  });
  
  modal.style.display = "flex";
}

// 確認画面を閉じる
function closeOutside() {
  document.getElementById("outside-modal").style.display = "none";
}

// --- 5. ライフの準備 ---
function setupLife() {
  const lifeStack = document.getElementById("life-stack");
  lifeStack.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    if (deck.length > 0) {
      const cardData = deck.shift();
      const card = document.createElement("div");
      card.className = "life-card";
      card.style.top = (i * 12) + "px";
      card.style.zIndex = i;
      card.onclick = () => {
        if(confirm("手札に加えますか？")) {
          hand.push(cardData);
          card.remove();
          updateDisplay();
        }
      };
      lifeStack.appendChild(card);
    }
  }
}

// --- 6. カードを場に出す ---
function placeCard(slot) {
  // --- 1. 手札から場に出す ---
  if (selectedHandIndex !== null && slot.children.length === 0) {
    const cardData = hand.splice(selectedHandIndex, 1)[0];
    const img = document.createElement("img");
    img.src = cardData.image;
    img.dataset.cardData = JSON.stringify(cardData);
    
    // 画像単体をクリックした時は何もしない（親のslotにイベントを任せる）
    // その代わり、移動ではなく「レスト」だけさせたい時のために後述の処理を追加
    img.style.pointerEvents = "none"; 

    slot.appendChild(img);
    selectedHandIndex = null;
    canMulligan = false;
    document.getElementById("mulligan-btn").style.display = "none";
    updateDisplay();
    return; // 処理終了
  }

  // --- 2. 場にあるカードを選択する、またはレストさせる ---
  if (slot.children.length > 0) {
    // すでに選択されているスロットをもう一度タップした場合は「レスト」
    if (selectedFieldSlot === slot) {
      const img = slot.querySelector("img");
      img.classList.toggle("rest");
      slot.style.outline = "none";
      selectedFieldSlot = null; // レスト後は選択解除
    } 
    // まだ何も選択していない場合は「移動元」として選択
    else if (selectedFieldSlot === null) {
      selectedFieldSlot = slot;
      slot.style.outline = "2px solid #00e5ff";
    }
    return;
  }

  // --- 3. 選択したカードを空のスロットへ移動させる ---
  if (selectedFieldSlot !== null && slot.children.length === 0) {
    const img = selectedFieldSlot.querySelector("img");
    slot.appendChild(img);
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
    return;
  }

  // --- 4. どこでもない場所（空スロット）をタップしたら選択解除 ---
  if (selectedFieldSlot !== null) {
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
  }
}


// --- その他 補助機能 ---
function mulligan() {
  if(!canMulligan) return;
  startGame();
  canMulligan = false;
  document.getElementById("mulligan-btn").style.display = "none";
}

function nextTurn() {
  // 1. フィールドのカードをすべて消去
  const slots = document.querySelectorAll(".slot");
  slots.forEach(slot => {
    slot.innerHTML = "";
  });

  // 2. データの初期化
  hand = [];
  outsideCards = [];
  selectedHandIndex = null;
  canMulligan = false;

  // 3. APとUIのリセット
  resetAP();
  
  const outside = document.getElementById("outside-area");
  if (outside) {
    outside.style.background = "rgba(255, 255, 255, 0.02)";
    outside.innerText = "OUTSIDE";
  }

  // 4. ボタン表示を初期に戻す
  const mulliganBtn = document.getElementById("mulligan-btn");
  const drawBtn = document.getElementById("draw-btn");
  if (mulliganBtn) mulliganBtn.style.display = "none";
  if (drawBtn) drawBtn.style.display = "none";

  // 5. 画面の再描画（手札を空にする）
  updateDisplay();

  // 6. デッキデータがある場合のみ、自動で再開する
  const saved = localStorage.getItem("deck");
  if (saved && saved !== "[]") {
    startGame();
  } else {
    alert("盤面をリセットしました。");
  }
}

function toggleAP(index) {
  const apCards = document.querySelectorAll(".ap-card");
  apCards[index].classList.toggle("used");
}

function resetAP() {
  document.querySelectorAll(".ap-card").forEach(c => c.classList.remove("used"));
}
// フィールドで選択したカードを手札に戻す処理
document.addEventListener('click', function(e) {
  const handArea = document.getElementById("hand");
  // クリックされたのが手札エリア内、かつフィールドのカードが選択されている時
  if (handArea.contains(e.target) && selectedFieldSlot !== null) {
    const img = selectedFieldSlot.querySelector("img");
    const cardData = JSON.parse(img.dataset.cardData);
    
    hand.push(cardData); // 手札データに追加
    selectedFieldSlot.innerHTML = ""; // 場から消す
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
    updateDisplay();
  }
}, true);


function updateDisplay() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  hand.forEach((card, i) => {
    const img = document.createElement("img");
    img.src = card.image;
    img.className = (selectedHandIndex === i) ? "selected" : "";
    img.onclick = () => { 
      selectedHandIndex = (selectedHandIndex === i) ? null : i; 
      updateDisplay(); 
    };
    handDiv.appendChild(img);
  });
  document.getElementById("deck-count").innerText = deck.length;
}

// --- シャッフル関数 ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
} // ←ここでしっかり閉じる！

// --- 山札確認機能 ---
let checkingCards = [];    // 確認エリアに並んでいるカードリスト
let selectedCheckIndex = null; // エリア内で選択中のカード番号

function viewDeckTop() {
  if (deck.length === 0) return alert("山札がありません");
  
  // 山札の一番上を1枚抜き取って確認リストへ移動
  const card = deck.shift();
  checkingCards.push(card);
  
  // 選択状態は一旦リセットして再描画
  selectedCheckIndex = null;
  renderCheckArea();
}

// 確認エリアの表示を更新する関数
function renderCheckArea() {
  const area = document.getElementById("deck-check-area");
  const list = document.getElementById("check-card-list");
  const controls = document.getElementById("check-controls");
  
  list.innerHTML = ""; // 表示をクリア
  area.style.display = "flex";

  checkingCards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.image;
    img.style.width = "75px"; // スマホで見やすいサイズ
    img.style.borderRadius = "5px";
    img.style.cursor = "pointer";
    img.style.transition = "transform 0.2s";
    
    // 選択されているカードに青枠をつける
    if (selectedCheckIndex === index) {
      img.style.outline = "3px solid #00e5ff";
      img.style.transform = "translateY(-5px)";
    } else {
      img.style.outline = "none";
    }
    
    img.onclick = () => {
      selectedCheckIndex = index;
      renderCheckArea(); // 再描画してボタンを表示させる
    };
    list.appendChild(img);
  });

  // カードが選択されている時だけ操作ボタンを表示
  controls.style.display = (selectedCheckIndex !== null) ? "flex" : "none";
  
  // 山札枚数の表示を更新
  document.getElementById("deck-count").innerText = deck.length;
}

// ボタンを押した時の処理
function processCheck(target) {
  if (selectedCheckIndex === null) return;

  // 確認リストから選択した1枚を抜き出す
  const card = checkingCards.splice(selectedCheckIndex, 1)[0];

  if (target === 'hand') {
    hand.push(card);
  } else if (target === 'bottom') {
    deck.push(card); // 山札の一番下へ
  } else if (target === 'top') {
    deck.unshift(card); // 山札の一番上へ戻す
  } else if (target === 'outside') {
    outsideCards.push(card); // 場外へ
    // 場外の枚数表示を更新
    const outsideArea = document.getElementById("outside-area");
    outsideArea.style.background = "rgba(0, 229, 255, 0.2)";
    outsideArea.innerText = `OUTSIDE (${outsideCards.length})`;
  }

  selectedCheckIndex = null; // 選択解除

  // まだ確認中のカードがあれば再表示、なければエリアを閉じる
  if (checkingCards.length > 0) {
    renderCheckArea();
  } else {
    document.getElementById("deck-check-area").style.display = "none";
  }
  updateDisplay();
}

// 「確認を終了」ボタン（残っているカードをすべて山札の上に戻す）
function closeCheckArea() {
  if (checkingCards.length > 0) {
    // 残っているものを右側（新しいもの）から順に山札の上に乗せていく
    while(checkingCards.length > 0) {
      deck.unshift(checkingCards.pop());
    }
  }
  selectedCheckIndex = null;
  checkingCards = [];
  document.getElementById("deck-check-area").style.display = "none";
  updateDisplay();
}