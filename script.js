const CORS_PROXY = "https://corsproxy.io/?";
const API_BASE = "https://deckofcardsapi.com/api/deck/";
let deckId = null;
let remainingCards = null;
let currentBet = 0;
let currentBalance = 500;
let WIN_TEXT = "You won the game!";
let LOSE_TEXT = "You lost the game!";
let PUSH_TEXT = "Push!";
let totalPlayerCards = 0;
let totalDealerCards = 0;

const shuffleCardsAndGetDeckId = async () => {
  const shuffledCardsResponse = await fetch(`${CORS_PROXY}${API_BASE}new/shuffle/?deck_count=6`);
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

const drawCards = async number => {
  const drawCardsResponse = await fetch(`${CORS_PROXY}${API_BASE}${deckId}/draw/?count=${number}`);
  const drawnCards = await drawCardsResponse.json();

  remainingCards = drawnCards.remaining;
  localStorage.setItem("remainingCards", remainingCards);
  console.log("Cards remaining: ", remainingCards);

  return drawnCards;
}

const startingScreen = rootElement => {
  const startScreen = `
    <div class="start-screen-container">
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
            <button id="all-in">All in</button> 
            <button id="bet-half">Bet half</button>
          </div>
          <div class="bet">
            <div class="start-cash">
              <h3>Starting cash: ${currentBalance}$</h3>
            </div>
            <div class="input-field">
              <input type="text" name="bet" id="bet">
              </div>
            <div class="start-button">
              <button id="submit">Start</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  rootElement.insertAdjacentHTML("beforeend", startScreen);
}

/* const betScreen = (conditionText, rootElement) => {
  const betScreen = `
    <div class="restart-screen-container">
      <div class="background"></div>

      <div class="restart-screen">
        <h1>${conditionText}</h1>
        <p>Would you like to try again?</p>
        <div class="restart-buttons">
          <button id="restart-yes">Yes</button>
          <button id="restart-no">No</button>
        </div>
      </div>
    </div>
  `;

  rootElement.insertAdjacentHTML("beforeend", betScreen);
} */

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
            <h2 id="betH2">Bet: ${currentBet}$<h2>
            <h2 id="balanceH2">Balance: ${currentBalance}$<h2>
          </div>
        </div>

        <div class="drawn-cards-info">
          <div class="dealer-player">
            <p id="dealer">Dealer - ${calculateStarterCards(drawnCardsForDealer)}</p>
            <p id="player">Player - ${calculateStarterCards(drawnCardsForPlayer)}</p>
          </div>
        </div>

        <div class="game-mechanic">
          <button class="hit"><strong>Hit</strong></button>
          <button class="stand"><strong>Stand</strong></button>
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

const winOrLoseOrPush = (gameCondition, isWin = true, hitButtonFn, playAgainFn, standButtonFn) => {
  const hitButton = document.querySelector(".hit");
  const standButton = document.querySelector(".stand");
  const drawnCardsInfo = document.querySelector(".drawn-cards-info");
  const balanceH2 = document.querySelector("#balanceH2");
  
  if (isWin) {
    currentBalance += currentBet * 2;
    balanceH2.innerText = `Balance: ${currentBalance}$`;
  }

  hitButton.innerHTML = `<strong>Play again</strong>`;
  hitButton.removeEventListener("click", hitButtonFn);
  hitButton.addEventListener("click", playAgainFn);

  standButton.innerHTML = `<strong>Quit</strong>`;
  standButton.removeEventListener("click", standButtonFn);

  drawnCardsInfo.insertAdjacentHTML("afterbegin", `<div class="condition-container">${gameCondition}</div>`);
}

const loadEvent = async () => {
  const rootElement = document.querySelector("#root");

  await loadDeckIdFromStorage();

  let drawnCardsForDealer = await drawCards(2);
  let drawnCardsForPlayer = await drawCards(2);

  await createDom(rootElement, drawnCardsForDealer, drawnCardsForPlayer);

  let hitButton = document.querySelector(".hit");
  let standButton = document.querySelector(".stand");
  let playerCards = document.querySelector(".player-cards");
  let dealerCards = document.querySelector(".dealer-cards");
  let playerP = document.querySelector("#player");
  let dealerP = document.querySelector("#dealer");
  let drawnCardsInfo = document.querySelector(".drawn-cards-info");
  let mechanicBtns = document.querySelector(".game-mechanic");

  const keepBetAndstartOver = async () => {
    hitButton.removeEventListener("click", keepBetAndstartOver);

    const gameContainer = document.querySelector(".game-container");
    
    gameContainer.remove();
    totalDealerCards = 0;
    totalPlayerCards = 0;
    currentBalance = currentBalance - currentBet;

    drawnCardsForPlayer = await drawCards(2);
    drawnCardsForDealer = await drawCards(2);

    await createDom(rootElement, drawnCardsForDealer, drawnCardsForPlayer);

    playerCards = document.querySelector(".player-cards");
    dealerCards = document.querySelector(".dealer-cards");
    playerP = document.querySelector("#player");
    dealerP = document.querySelector("#dealer");
    drawnCardsInfo = document.querySelector(".drawn-cards-info");
    mechanicBtns = document.querySelector(".game-mechanic");
    hitButton = document.querySelector(".hit");
    standButton = document.querySelector(".stand");

    hitButton.addEventListener("click", hitButtonFn);
    standButton.addEventListener("click", standButtonFn);
  }

  const playAgainFn = () => {
    const hitButton = document.querySelector(".hit");
    const standButton = document.querySelector(".stand");
    const mechanicBtns = document.querySelector(".game-mechanic");
    
    hitButton.removeEventListener("click", playAgainFn);
    
    hitButton.innerHTML = `<strong>Keep bet</strong>`;
    standButton.innerHTML = `<strong>Change bet</strong>`;

    mechanicBtns.insertAdjacentHTML("beforeend", `<button id="back"><strong>Back</strong></button>`);

    hitButton.addEventListener("click", keepBetAndstartOver);   
  }

  const hitButtonFn = async () => {

    const drawnCard = await drawCards(1);

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
      winOrLoseOrPush(LOSE_TEXT, isWin = false, hitButtonFn, playAgainFn, standButtonFn);
    } else if (totalPlayerCards === 21) {  
      winOrLoseOrPush(WIN_TEXT, isWin = true, hitButtonFn, playAgainFn, standButtonFn);
    }
  }

  const standButtonFn = async () => {
    if (totalDealerCards === 0) {
      totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[0]);
      totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[1]);
    } if (totalPlayerCards === 0) {
      totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[0]);
      totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[1]);
    }

    while (totalDealerCards < 17) {
      await new Promise(timer => setInterval(timer, 1000));

      const drawnCard = await drawCards(1);

      calculateCards(drawnCard.cards[0], false);

      dealerCards.insertAdjacentHTML("beforeend", `
        <div>
          <img src="${drawnCard.cards[0].image}" class="card" />
        </div>
      `);

      dealerP.innerText = `Dealer - ${totalDealerCards}`;
    }

    if (totalDealerCards > 21 || totalDealerCards < totalPlayerCards) {
      winOrLoseOrPush(WIN_TEXT, isWin = true, hitButtonFn, playAgainFn, standButtonFn);
    } else if (totalDealerCards > totalPlayerCards) {
      winOrLoseOrPush(LOSE_TEXT, isWin = false, hitButtonFn, playAgainFn, standButtonFn);
    } else {
      winOrLoseOrPush(PUSH_TEXT, isWin = false, hitButtonFn, playAgainFn, standButtonFn);
    }
  }

  hitButton.addEventListener("click", hitButtonFn);
  standButton.addEventListener("click", standButtonFn);

  startingScreen(rootElement);

  let startScreenContainer = document.querySelector(".start-screen-container");
  let submitBtn = document.querySelector("#submit");
  let inputField = document.querySelector("#bet");
  let betH2 = document.querySelector("#betH2");
  let balanceH2 = document.querySelector("#balanceH2");
  let allInBtn = document.querySelector("#all-in");
  let betHalfBtn = document.querySelector("#bet-half");

  inputField.addEventListener("keypress", e => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (inputField.value.length === 0 && e.key === "0") {
      e.preventDefault();
      return;
    }
  });

  inputField.addEventListener("click", () => {
    inputField.value = "";
  });

  allInBtn.addEventListener("click", () => {
    inputField.value = `${currentBalance}`;
  });

  betHalfBtn.addEventListener("click", () => {
    inputField.value = `${currentBalance / 2}`;
  });

  submitBtn.addEventListener("click", () => {
    const betAmount = parseInt(inputField.value);

    if (betAmount > 0 && betAmount <= currentBalance) {
      currentBet = betAmount;
      startScreenContainer.classList.toggle("disable-start-screen");

      currentBalance = currentBalance - betAmount;
      balanceH2.innerText = `Balance: ${currentBalance}$`;
      betH2.innerText = `Bet: ${currentBet}$`;
    } else if (isNaN(betAmount)) {
      inputField.value = "Please enter a number!";
    } else {
      inputField.value = "Bet more than balance!";
    }

    totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[0]);
    totalDealerCards += convertStringValueToNumber(drawnCardsForDealer.cards[1]);

    totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[0]);
    totalPlayerCards += convertStringValueToNumber(drawnCardsForPlayer.cards[1]);

    if (totalDealerCards === 21) {
      winOrLoseOrPush(LOSE_TEXT, isWin = false, balanceH2, hitButton, standButton, drawnCardsInfo, hitButtonFn, playAgainFn, standButtonFn);
    } else if (totalPlayerCards === 21) {
      winOrLoseOrPush(WIN_TEXT, isWin = true, balanceH2, hitButton, standButton, drawnCardsInfo, hitButtonFn, playAgainFn, standButtonFn);
    }
  });
}

window.addEventListener("load", loadEvent);