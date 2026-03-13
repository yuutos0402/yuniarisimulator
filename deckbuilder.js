let currentDeck = [];
let allCards = [];
let currentCategory = 'all';

window.onload = async () => {
  await loadCards();
  renderSavedDecksList();
  const saved = localStorage.getItem("deck");
  if(saved) {
    try {
      currentDeck = JSON.parse(saved);
      updateDeckDisplay();
    } catch(e) { console.error(e); }
  }
  showCards();
};

async function loadCards() {
  try {
    const response = await fetch('cards.json');
    allCards = await response.json();
  } catch (e) {
    console.error("JSON読み込み失敗:", e);
  }
}

function addToDeck(card) {
  if (currentDeck.length >= 50) return alert("デッキは50枚までです。");
  const limit = card.maxCount || 4;
  const count = currentDeck.filter(c => c.id === card.id).length;
  if (count >= limit) return alert(`${card.name} は最大 ${limit} 枚までです。`);

  currentDeck.push({...card});
  updateDeckDisplay();
}

function removeFromDeck(cardId) {
  const index = currentDeck.findIndex(c => c.id === cardId);
  if (index !== -1) {
    currentDeck.splice(index, 1);
    updateDeckDisplay();
  }
}

function updateDeckDisplay() {
  const deckDiv = document.getElementById("deck");
  const countDiv = document.getElementById("deckCount");
  deckDiv.innerHTML = "";

  const uniqueIds = [...new Set(currentDeck.map(c => c.id))];
  const displayCards = uniqueIds.map(id => currentDeck.find(c => c.id === id));

  displayCards.forEach(card => {
    const count = currentDeck.filter(c => c.id === card.id).length;
    const wrapper = document.createElement("div");
    wrapper.className = "card-wrapper";

    const img = document.createElement("img");
    img.src = card.image;
    img.className = "deckcard";
    img.onclick = () => removeFromDeck(card.id);
    img.onerror = () => { img.src = "https://placehold.jp/150x210.png?text=NoImage"; };

    wrapper.appendChild(img);

    if (count > 1) {
      const badge = document.createElement("div");
      badge.className = "count-badge";
      badge.innerText = `×${count}`;
      wrapper.appendChild(badge);
    }
    deckDiv.appendChild(wrapper);
  });
  countDiv.innerText = `${currentDeck.length} / 50`;
}

function showCards() {
  const listDiv = document.getElementById("cardList");
  const searchText = document.getElementById("searchBox").value.toLowerCase();
  listDiv.innerHTML = "";

  const filtered = allCards.filter(c => {
    const matchesCategory = (currentCategory === 'all' || c.category === currentCategory);
    return matchesCategory && c.name.toLowerCase().includes(searchText);
  });

  filtered.forEach(card => {
    const img = document.createElement("img");
    img.src = card.image;
    img.className = "card";
    img.onclick = () => addToDeck(card);
    img.onerror = () => { img.src = "https://placehold.jp/150x210.png?text=NoImage"; };
    listDiv.appendChild(img);
  });
}

function setCategory(cat) { currentCategory = cat; showCards(); }
function clearDeck() { if(confirm("クリアしますか？")) { currentDeck = []; updateDeckDisplay(); } }
function openSaveModal() { document.getElementById("modal-overlay").classList.add("active"); }
function closeModal() { document.getElementById("modal-overlay").classList.remove("active"); }

function confirmSave() {
  const name = document.getElementById("deckNameInput").value.trim() || "無題";
  const savedDecks = JSON.parse(localStorage.getItem("savedDecks") || "[]");
  savedDecks.push({ name: name, cards: currentDeck });
  localStorage.setItem("savedDecks", JSON.stringify(savedDecks));
  localStorage.setItem("deck", JSON.stringify(currentDeck));
  closeModal();
  renderSavedDecksList();
}

function renderSavedDecksList() {
  const list = document.getElementById("savedDecksList");
  const saved = JSON.parse(localStorage.getItem("savedDecks") || "[]");
  list.innerHTML = "";
  saved.forEach((d, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${d.name} (${d.cards.length})</span>
      <div><button onclick="loadDeck(${i})">使う</button><button class="btn-danger" onclick="deleteDeck(${i})">削除</button></div>`;
    list.appendChild(li);
  });
}

function loadDeck(i) {
  const saved = JSON.parse(localStorage.getItem("savedDecks") || "[]");
  currentDeck = saved[i].cards;
  localStorage.setItem("deck", JSON.stringify(currentDeck));
  updateDeckDisplay();
}

function deleteDeck(i) {
  if(!confirm("削除しますか？")) return;
  let saved = JSON.parse(localStorage.getItem("savedDecks") || "[]");
  saved.splice(i, 1);
  localStorage.setItem("savedDecks", JSON.stringify(saved));
  renderSavedDecksList();
}
