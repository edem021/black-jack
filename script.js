let deckId = null;
let remainingCards = null;

const shuffleCardsAndGetDeckId = async () => {
  const shuffledCardsResponse = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6");
  const dataOfShuffledCards = await shuffledCardsResponse.json();

  deckId = dataOfShuffledCards.deck_id;
  remainingCards = dataOfShuffledCards.remaining;

  localStorage.setItem("deckId", deckId);
  localStorage.setItem("remainingCards", remainingCards);
}

const loadDeckIdFromStorage = async () => {
  deckId = localStorage.getItem("deckId");
  remainingCards = parseInt(localStorage.getItem("remainingCards") || null);

  if (!deckId || remainingCards === 0) {
    await shuffleCardsAndGetDeckId();
  } else {
    console.log("Cards remaining: ", remainingCards);
  }
}

const drawStarterCards = async () => {
  const drawStarterCardsResponse = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`);
  const StarterCards = await drawStarterCardsResponse.json();

  remainingCards = StarterCards.remaining;
  localStorage.setItem("remainingCards", remainingCards);
  console.log("Cards remaining: ", remainingCards);

  return StarterCards;
}

const drawCard = async () => {
  const drawCardRespone = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
  const drawnCard = await drawCardRespone.json();

  remainingCards = drawnCard.remaining;
  localStorage.setItem("remainingCards", remainingCards);
  console.log("Cards remaining: ", remainingCards);

  return drawnCard;
}

const startingScreen = () => {
  const startScreen = `
    <div class="background"></div>

    <div class="start-screen">
      <div class="welcome-text">
        <h1>Welcome to Blackjack!</h1>
        <h3>The game is about getting as close as possible to 21 without going over</h3>
        <ul>
          <li>You and the dealer start with <strong>two</strong> cards each</li>
          <li>Number cards are worth their face value</li>
          <li>Face cards <strong>(King, Queen, Jack)</strong> are worth <strong>10</strong></li>
          <li><strong>Aces</strong> can be <strong>1</strong> or <strong>11</strong>, depending on what helps you the most</li>
          <li>You can <strong>Hit</strong> to draw another card or <strong>Stand</strong> to keep your current hand</li>
          <li>The dealer must keep drawing until they reach at least <strong>17</strong></li>
          <li>If you go over <strong>21</strong>, you <strong>Bust</strong> and lose the round</li>
        </ul>
      </div>
      <div class="betting-container">
        <h2>Please place your bet</h2>
        <div class="buttons">
          <button>All in</button> 
          <button>Bet half</button>
        </div>
        <div class="bet">
          <div class="start-cash">
            <h3>Starting cash: ${betBalance()}$</h3>
          </div>
          <div class="input-field">
            <input type="text" name="bet" id="bet">
            </div>
          <div class="submit">
            <input type="submit" value="Start">
          </div>
        </div>
      </div>
    </div>
  `;
  
  return startScreen;
}

const betBalance = () => {
  let balance = 500;

  return balance;
}

const convertStringValueToNumber = ({ value }) => {
  let card = 0;

  if (!isNaN(value)) {
    card = parseInt(value);
  } else if (value === "ACE") {
    card = 11;
  } else {
    card = 10;
  }

  return card;
}

const calculateStarterCards = ({ cards }) => {
  let firstCard = convertStringValueToNumber(cards[0]);
  let secondCard = convertStringValueToNumber(cards[1]);

  if (firstCard + secondCard > 21) {
    firstCard === 11 ? firstCard = 1 : secondCard = 1;
  }

  return firstCard + secondCard;
}

let totalPlayerCards = 0;
let totalDealerCards = 0;

const calculateCards = (card, isPlayer = true) => {
  const cardNum = convertStringValueToNumber(card);

  const checkConditions = (value, totalCards) => {
    if (totalCards > 21 && value === "ACE") {
      totalCards -= 10;
    }
    return totalCards;
  }

  if (isPlayer) {
    totalPlayerCards += cardNum;
    totalPlayerCards = checkConditions(card.value, totalPlayerCards);
  } else {
    totalDealerCards += cardNum;
    totalDealerCards = checkConditions(card.value, totalDealerCards);
  }
}

const createDom = async (rootElement, drawnCardsForDealer, drawnCardsForPlayer) => {
  if (remainingCards < 4) {
    await shuffleCardsAndGetDeckId();
  }

  const domHtml = `
    <div class="game-container">
      <div class="dealer-cards">
        <div>
          <img src="${drawnCardsForDealer.cards[0].image}" class="card" />
        </div>
        <div>
          <img src="${drawnCardsForDealer.cards[1].image}" class="card" />
        </div>
      </div>

      <div class="info-container">
        <div class="betting-info">
          <div class="bets">
            <h2>Bet: $<h2>
            <h2>Balance: ${betBalance()}$<h2>
          </div>
        </div>

        <div class="drawn-cards-info">
          <p id="dealer">Dealer - ${calculateStarterCards(drawnCardsForDealer)}</p>
          <p id="player">Player - ${calculateStarterCards(drawnCardsForPlayer)}</p>
        </div>

        <div class="game-mechanic">
          <button id="hit"><strong>Hit</strong></button>
          <button id="stand"><strong>Stand</strong></button>
        </div>
      </div>

      <div class="player-cards">
        <div>
          <img src="${drawnCardsForPlayer.cards[0].image}" class="card" />
        </div>
        <div>
          <img src="${drawnCardsForPlayer.cards[1].image}" class="card" />
        </div>
      </div>
    </div>
  `;
  rootElement.insertAdjacentHTML("beforeend", domHtml);
}

const loadEvent = async () => {
  const rootElement = document.querySelector("#root");

  await loadDeckIdFromStorage();

  const drawnCardsForDealer = await drawStarterCards();
  const drawnCardsForPlayer = await drawStarterCards();

  await createDom(rootElement, drawnCardsForDealer, drawnCardsForPlayer);

  const hitButton = document.querySelector("#hit");
  const standButton = document.querySelector("#stand");
  const playerCards = document.querySelector(".player-cards");
  const dealerCards = document.querySelector(".dealer-cards");
  const playerP = document.querySelector("#player");
  const dealerP = document.querySelector("#dealer");

  hitButton.addEventListener("click", async () => {
    const drawnCard = await drawCard();

    if (totalPlayerCards === 0) {
      totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[0]);
      totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[1]);
    }

    playerCards.insertAdjacentHTML("beforeend", `
      <div>
        <img src="${drawnCard.cards[0].image}" class="card" />
      </div>
    `);

    calculateCards(drawnCard.cards[0], true);

    playerP.innerText = `Player - ${totalPlayerCards}`;

    if (totalPlayerCards > 21) {
      console.log("You busted");
    }
  });

  standButton.addEventListener("click", async () => {
    if (totalDealerCards === 0) {
      totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[0]);
      totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[1]);
    }

    while (totalDealerCards < 17) {
      await new Promise(timer => setInterval(timer, 1000));

      const drawnCard = await drawCard();

      calculateCards(drawnCard.cards[0], false);

      dealerCards.insertAdjacentHTML("beforeend", `
        <div>
          <img src="${drawnCard.cards[0].image}" class="card" />
        </div>
      `);

      dealerP.innerText = `Dealer - ${totalDealerCards}`;
    }

    if (totalDealerCards > 21) {
      console.log("Dealer busted");
    }
  });

  rootElement.insertAdjacentHTML("beforeend", startingScreen());
}

window.addEventListener("load", loadEvent);