const API_BASE = "https://deckofcardsapi.com/api/deck/";
let deckId, balance = 500, bet = 0, playerHand = [], dealerHand = [];

const root = document.getElementById("root");

const drawCards = async count => (await fetch(`${API_BASE}${deckId}/draw/?count=${count}`)).json().then(({ cards }) => cards);

const getHandValue = hand => {
  let sum = 0, aces = 0;
  for (const card of hand) {
    sum += card.value === "ACE" ? 11 : ["KING", "QUEEN", "JACK"].includes(card.value) ? 10 : parseInt(card.value);
    if (card.value === "ACE") aces++;
  }
  while (sum > 21 && aces--) sum -= 10;
  return sum;
};

const startScreen = () => {
  root.innerHTML = `
    <div class="start-screen">
      <h1>Welcome to Blackjack!</h1>
      <ul>
        <li>Get close to 21 without going over</li>
        <li>Face cards = 10, Aces = 1 or 11</li>
        <li>Dealer hits until 17</li>
      </ul>
      <h2>Bet (Balance: $${balance})</h2>
      <input type="number" id="bet" min="1" max="${balance}">
      <div>
        <button onclick="startGame()">Start</button>
        <button onclick="document.getElementById('bet').value = ${balance}">All In</button>
        <button onclick="document.getElementById('bet').value = ${balance / 2}">Half</button>
      </div>
    </div>
  `;
};

const gameScreen = (showDealer = false) => {
  root.innerHTML = `
    <div class="game-container">
      <div class="cards">
        ${dealerHand.map((card, index) => `<img src="${index === 1 && !showDealer ? 'https://deckofcardsapi.com/static/img/back.png' : card.image}">`).join('')}
      </div>
      <div class="info">
        <p>Dealer: ${showDealer ? getHandValue(dealerHand) : getHandValue([dealerHand[0]])}</p>
        <p>Bet: $${bet} | Balance: $${balance}</p>
        <div class="game-condition"></div>
        <p>Player: ${getHandValue(playerHand)}</p>
      </div>
      <div class="cards">${playerHand.map(({ image }) => `<img src="${image}">`).join('')}</div>
      <div class="buttons">
        <button onclick="hit()">Hit</button>
        <button onclick="stand()">Stand</button>
      </div>
    </div>
  `;
};

const endGame = (result, win) => {
  if (win) balance += bet * 2;
  gameScreen(true);
  document.querySelector(".game-condition").textContent = result;
  const hitBtn = document.querySelector("button[onclick='hit()']");
  hitBtn.textContent = "Play Again";
  hitBtn.onclick = () => (root.innerHTML = "", startScreen());
  document.querySelector("button[onclick='stand()']").remove();
};

const hit = async () => {
  playerHand.push(...await drawCards(1));
  gameScreen();
  const value = getHandValue(playerHand);
  if (value > 21) endGame("You lost!", false);
  else if (value === 21) endGame("You won!", true);
};

const stand = async () => {
  while (getHandValue(dealerHand) < 17) dealerHand.push(...await drawCards(1));
  const playerValue = getHandValue(playerHand);
  const dealerValue = getHandValue(dealerHand);
  if (dealerValue > 21 || playerValue > dealerValue) endGame("You won!", true);
  else if (playerValue < dealerValue) endGame("You lost!", false);
  else endGame("Push!", false);
};

const startGame = async () => {
  bet = parseInt(document.getElementById("bet").value);
  if (!bet || bet > balance) return alert("Invalid bet!");
  balance -= bet;
  if (!deckId) deckId = (await (await fetch(`${API_BASE}new/shuffle/?deck_count=1`)).json()).deck_id;
  playerHand = await drawCards(2);
  dealerHand = await drawCards(2);
  gameScreen();
  if (getHandValue(playerHand) === 21) endGame("You won!", true);
  else if (getHandValue(dealerHand) === 21) endGame("You lost!", false);
};

startScreen();