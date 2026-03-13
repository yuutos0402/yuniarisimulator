let deck = [];
let hand = [];
let selectedHandIndex = null;
let canMulligan = false;

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
  resetAP();
  updateDisplay();
}

function mulligan() {
  if(!canMulligan) return;
  startGame();
  canMulligan = false;
  document.getElementById("mulligan-btn").style.display = "none";
}

function nextTurn() {
  resetAP();
  drawCard();
  canMulligan = false;
  document.getElementById("mulligan-btn").style.display = "none";
}

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
        if(confirm("手札に加えますか？")) hand.push(cardData);
        card.remove();
        updateDisplay();
      };
      lifeStack.appendChild(card);
    }
  }
}

function toggleAP(index) {
  const apCards = document.querySelectorAll(".ap-card");
  apCards[index].classList.toggle("used");
}

function resetAP() {
  document.querySelectorAll(".ap-card").forEach(c => c.classList.remove("used"));
}

function placeCard(slot) {
  if (selectedHandIndex !== null && slot.children.length === 0) {
    canMulligan = false;
    document.getElementById("mulligan-btn").style.display = "none";

    const unusedAP = document.querySelector(".ap-card:not(.used)");
    if(unusedAP) unusedAP.classList.add("used");

    const card = hand.splice(selectedHandIndex, 1)[0];
    const img = document.createElement("img");
    img.src = card.image;
    img.onclick = (e) => { e.stopPropagation(); img.classList.toggle("rest"); };
    slot.appendChild(img);
    selectedHandIndex = null;
    updateDisplay();
  }
}

function updateDisplay() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  hand.forEach((card, i) => {
    const img = document.createElement("img");
    img.src = card.image;
    img.className = (selectedHandIndex === i) ? "selected" : "";
    img.onclick = () => { selectedHandIndex = (selectedHandIndex === i) ? null : i; updateDisplay(); };
    handDiv.appendChild(img);
  });
  document.getElementById("deck-count").innerText = deck.length;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function drawCard() {
  if (deck.length > 0) {
    hand.push(deck.shift());
    updateDisplay();
  }
}
