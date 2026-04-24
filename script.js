// --- 1. 変数の定義（必ずファイルの先頭に置く） ---
let deck = [];
let hand = [];
let outsideCards = [];
let removedCards = [];
let selectedHandIndex = null;
let canMulligan = false;
let selectedFieldSlot = null; 
let selectedOutsideIndex = null; //

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
  if (selectedHandIndex !== null) {
    const card = hand.splice(selectedHandIndex, 1)[0];
    outsideCards.push(card);
    selectedHandIndex = null;
  } 
  else if (selectedFieldSlot !== null) {
    // ★修正：スロット内のすべてのカード（img）をループで場外へ
    const imgs = selectedFieldSlot.querySelectorAll("img");
    imgs.forEach(img => {
      const cardData = JSON.parse(img.dataset.cardData);
      outsideCards.push(cardData);
    });
    selectedFieldSlot.innerHTML = ""; // スロットを空にする
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
  } 
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

// メニューの状態をきれいにリセットする関数
function resetActionMenu() {
  const menu = document.getElementById("card-action-menu");
  
  // ライフ用に追加された画像（life-preview）があれば消す
  const preview = menu.querySelector(".life-preview");
  if (preview) preview.remove();
  
  // ライフ用に追加された「場外へ送る」ボタンがあれば消す
  const btnOutsideLife = document.getElementById("btn-to-outside-life");
  if (btnOutsideLife) btnOutsideLife.remove();
  
  return menu; // きれいになったメニューを返す
}


// 場外一覧を表示する
function openOutside() {
  if (outsideCards.length === 0) return alert("場外にカードはありません");
  
  const modal = document.getElementById("outside-modal");
  const list = document.getElementById("outside-list");
  
  list.innerHTML = ""; 
  outsideCards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.image;
    img.style.width = "100%";
    img.style.borderRadius = "4px";
    img.style.cursor = "pointer";

        // カードをクリックした時の処理
    img.onclick = (e) => {
      e.stopPropagation(); 
      selectedOutsideIndex = index;
      
      // ★追加：メニューをリセットしてから表示
      const menu = resetActionMenu();
      menu.style.display = "flex";

      // メニューボタンに機能を割り当て
      document.getElementById("btn-to-hand").onclick = () => moveFromOutside('hand');
      document.getElementById("btn-to-field").onclick = () => moveFromOutside('field');
    };
    list.appendChild(img);
  });
  
  modal.style.display = "flex";
}


// 確認画面を閉じる
function closeOutside() {
  document.getElementById("outside-modal").style.display = "none";
}
function moveFromOutside(destination) {
  if (selectedOutsideIndex === null) return;
  
  const card = outsideCards[selectedOutsideIndex];
  document.getElementById("card-action-menu").style.display = "none";

  if (destination === 'hand') {
    hand.push(card);
    outsideCards.splice(selectedOutsideIndex, 1);
  } 
  else if (destination === 'field') {
    const slots = document.querySelectorAll(".slot");
    let targetSlot = Array.from(slots).find(slot => slot.children.length === 0);

    if (targetSlot) {
      const img = document.createElement("img");
      img.src = card.image;
      img.dataset.cardData = JSON.stringify(card);
      img.style.pointerEvents = "none";
      targetSlot.appendChild(img);
      outsideCards.splice(selectedOutsideIndex, 1);
    } else {
      alert("空きスロットがありません");
      return;
    }
  }

  selectedOutsideIndex = null;
  
  // 場外エリアの表示更新
  const outside = document.getElementById("outside-area");
  if (outsideCards.length > 0) {
    outside.innerText = `OUTSIDE (${outsideCards.length})`;
    openOutside(); // リストを再描画して継続
  } else {
    outside.innerText = "OUTSIDE";
    outside.style.background = "rgba(255, 255, 255, 0.02)";
    closeOutside();
  }
  updateDisplay();
}


// --- 5. ライフの準備（最新版：配列管理へ変更） ---
let currentLifeData = []; // ライフの状態を保持する変数

function setupLife() {
  const lifeStack = document.getElementById("life-stack");
  lifeStack.innerHTML = "";
  currentLifeData = []; // 初期化
  
  // デッキから7枚をライフ配列に移動
  for (let i = 0; i < 7; i++) {
    if (deck.length > 0) {
      currentLifeData.push(deck.shift());
    }
  }
  renderLife();
}

// ライフを画面に描画する専用の関数
function renderLife() {
  const lifeStack = document.getElementById("life-stack");
  lifeStack.innerHTML = "";
  
  currentLifeData.forEach((cardData, i) => {
    const card = document.createElement("div");
    card.className = "life-card";
    card.style.top = (i * 12) + "px";
    card.style.zIndex = i;
    
    card.onclick = () => {
      // ライフをクリックした時にメニューを表示
      showLifeMenu(cardData, i);
    };
    lifeStack.appendChild(card);
  });
}


// --- ライフ用のアクションメニューを表示（画像プレビュー＆場外ボタン付き） ---
function showLifeMenu(cardData, index) {
  // ★追加：メニューをリセット
  const menu = resetActionMenu();
  const btnHand = document.getElementById("btn-to-hand");
  const btnField = document.getElementById("btn-to-field");
  
  // 1. カード画像のプレビューを表示（毎回新しく作る）
  const previewImg = document.createElement("img");
  previewImg.className = "life-preview";
  previewImg.src = cardData.image;
  previewImg.style.width = "120px";
  previewImg.style.borderRadius = "8px";
  previewImg.style.marginBottom = "10px";
  previewImg.style.display = "block";
  previewImg.style.marginLeft = "auto";
  previewImg.style.marginRight = "auto";
  menu.insertBefore(previewImg, menu.firstChild);
  
  // 2. 「場外へ」ボタンを作成（毎回新しく作る）
  const btnOutside = document.createElement("button");
  btnOutside.id = "btn-to-outside-life";
  btnOutside.innerText = "場外へ送る";
  btnOutside.style.background = "#ff4444";
  btnOutside.style.color = "white";
  btnOutside.style.padding = "10px";
  btnOutside.style.marginTop = "5px";
  btnOutside.style.border = "none";
  btnOutside.style.borderRadius = "4px";
  btnOutside.style.fontWeight = "bold";
  // キャンセルボタンの上に配置
  menu.appendChild(btnOutside);
  
  menu.style.display = "flex";

  // 3. 各ボタンの処理を割り当て
  btnHand.onclick = () => {
    hand.push(cardData);
    finalizeLifeAction(index);
  };

  btnField.onclick = () => {
    const slots = document.querySelectorAll(".slot");
    let targetSlot = Array.from(slots).find(slot => slot.children.length === 0);
    if (targetSlot) {
      const img = document.createElement("img");
      img.src = cardData.image;
      img.dataset.cardData = JSON.stringify(cardData);
      img.style.pointerEvents = "none";
      targetSlot.appendChild(img);
      finalizeLifeAction(index);
    } else {
      alert("空きスロットがありません");
    }
  };

  btnOutside.onclick = () => {
    outsideCards.push(cardData);
    const outsideArea = document.getElementById("outside-area");
    outsideArea.style.background = "rgba(0, 229, 255, 0.2)";
    outsideArea.innerText = `OUTSIDE (${outsideCards.length})`;
    finalizeLifeAction(index);
  };
}

// 4. ライフ処理の共通終了関数
function finalizeLifeAction(index) {
  currentLifeData.splice(index, 1); // ライフ配列から削除
  document.getElementById("card-action-menu").style.display = "none";
  renderLife(); // ライフの並びを更新
  updateDisplay(); // 手札などのUIを更新
}



// --- 6. カードを場に出す（重ねがけ対応版） ---
function placeCard(slot) {
  // --- 1. 手札から場に出す（または重ねる） ---
  if (selectedHandIndex !== null) {
    const cardData = hand.splice(selectedHandIndex, 1)[0];
    const img = document.createElement("img");
    img.src = cardData.image;
    img.dataset.cardData = JSON.stringify(cardData);
    img.style.pointerEvents = "none";

    // 重なっている枚数に応じて少し位置をずらす（スタック表現）
    const stackCount = slot.querySelectorAll("img").length;
    if (stackCount > 0) {
      img.style.position = "absolute";
      img.style.top = (stackCount * 5) + "px"; // 5pxずつ下にずらす
      img.style.left = "0";
      img.style.zIndex = stackCount;
    }

    slot.appendChild(img);
    selectedHandIndex = null;
    canMulligan = false;
    document.getElementById("mulligan-btn").style.display = "none";
    updateDisplay();
    return;
  }

  // --- 2. 場にあるカードを選択、またはレスト ---
  if (slot.children.length > 0) {
    if (selectedFieldSlot === slot) {
      // スロット内のすべての画像（重ねたカード全部）を回転させる
      const imgs = slot.querySelectorAll("img");
      imgs.forEach(img => img.classList.toggle("rest"));
      slot.style.outline = "none";
      selectedFieldSlot = null;
    } 
    else if (selectedFieldSlot === null) {
      selectedFieldSlot = slot;
      slot.style.outline = "2px solid #00e5ff";
    }
    return;
  }

  // --- 3. 選択したカード（束ごと）を空スロットへ移動 ---
  if (selectedFieldSlot !== null && slot.children.length === 0) {
    // スロット内の子要素をすべて移動させる
    while (selectedFieldSlot.firstChild) {
      slot.appendChild(selectedFieldSlot.firstChild);
    }
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
    return;
  }

  // 4.選択の解除
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
}

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
// リムーブエリアに送る関数
function moveToRemove() {
  let cardData = null;

  // A. 手札が選択されている場合
  if (selectedHandIndex !== null) {
    cardData = hand.splice(selectedHandIndex, 1)[0];
    selectedHandIndex = null;
  } 
  // B. フィールドのカードが選択されている場合
  else if (selectedFieldSlot !== null) {
    const img = selectedFieldSlot.querySelector("img");
    cardData = JSON.parse(img.dataset.cardData);
    selectedFieldSlot.innerHTML = "";
    selectedFieldSlot.style.outline = "none";
    selectedFieldSlot = null;
  } 
  // C. 何も選択されていない場合は中身を見る（後述の表示機能）
  else {
    openRemoveList();
    return;
  }

  if (cardData) {
    removedCards.push(cardData);
    updateRemoveDisplay();
    updateDisplay();
  }
}

// リムーブエリアの見た目を更新
function updateRemoveDisplay() {
  const removeArea = document.querySelector(".mini-box"); // REMOVEの枠
  if (removedCards.length > 0) {
    removeArea.style.background = "rgba(255, 68, 68, 0.2)"; // 少し赤くする
    removeArea.innerText = `REMOVE (${removedCards.length})`;
  } else {
    removeArea.style.background = "rgba(255, 255, 255, 0.02)";
    removeArea.innerText = "REMOVE";
  }
}
function openRemoveList() {
  if (removedCards.length === 0) return alert("リムーブにカードはありません");
  
  const modal = document.getElementById("outside-modal");
  const list = document.getElementById("outside-list");
  const title = modal.querySelector("div"); // タイトル部分
  
  title.innerText = "リムーブカード一覧";
  list.innerHTML = ""; 

  removedCards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.image;
    img.style.width = "100%";
    img.style.borderRadius = "4px";
    img.onclick = (e) => {
      e.stopPropagation();
      // 再利用するためにメニューを開く
      showRemoveActionMenu(card, index);
    };
    list.appendChild(img);
  });
  modal.style.display = "flex";
}

function showRemoveActionMenu(card, index) {
  const menu = document.getElementById("card-action-menu");
  menu.style.display = "flex";

  document.getElementById("btn-to-hand").onclick = () => {
    hand.push(removedCards.splice(index, 1)[0]);
    closeAndRefreshRemove();
  };
  document.getElementById("btn-to-field").onclick = () => {
    // フィールドへ出す処理（既存のロジック流用）
    const slots = document.querySelectorAll(".slot");
    let targetSlot = Array.from(slots).find(slot => slot.children.length === 0);
    if (targetSlot) {
      const img = document.createElement("img");
      img.src = card.image;
      img.dataset.cardData = JSON.stringify(card);
      img.style.pointerEvents = "none";
      targetSlot.appendChild(img);
      removedCards.splice(index, 1);
      closeAndRefreshRemove();
    }
  };
}

function closeAndRefreshRemove() {
  document.getElementById("card-action-menu").style.display = "none";
  updateRemoveDisplay();
  if (removedCards.length > 0) openRemoveList();
  else closeOutside();
  updateDisplay();
}

