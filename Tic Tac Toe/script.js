/* =========================================================
   TIC TAC TOE — GAME LOGIC
   ========================================================= */

/* ---------------------------------------------------------
   State variables
   --------------------------------------------------------- */
let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;

/* All possible winning combinations (indexes on the board) */
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

/* ---------------------------------------------------------
   DOM references
   --------------------------------------------------------- */
const squares = document.querySelectorAll(".square");
const statusText = document.getElementById("statusText");
const resetButton = document.getElementById("resetButton");

/* ---------------------------------------------------------
   Initialise the game
   --------------------------------------------------------- */
function initGame() {
  squares.forEach(square => {
    square.addEventListener("click", handleSquareClick);
  });

  resetButton.addEventListener("click", resetGame);

  updateStatusDisplay(`Player ${currentPlayer}'s Turn`);
}

/* ---------------------------------------------------------
   Handle a square being clicked
   --------------------------------------------------------- */
function handleSquareClick(event) {
  const square = event.target;
  const index = parseInt(square.getAttribute("data-index"));

  // Ignore click if game over or square already taken
  if (!gameActive || boardState[index] !== "") {
    return;
  }

  makeMove(index, square);
  checkGameResult();
}

/* ---------------------------------------------------------
   Make a move: update state + UI
   --------------------------------------------------------- */
function makeMove(index, squareElement) {
  boardState[index] = currentPlayer;

  squareElement.textContent = currentPlayer;
  squareElement.classList.add("taken");
  squareElement.classList.add(currentPlayer === "X" ? "x-mark" : "o-mark");
}

/* ---------------------------------------------------------
   Check for winner or draw, otherwise switch turns
   --------------------------------------------------------- */
function checkGameResult() {
  const winningCombo = getWinningCombination();

  if (winningCombo) {
    endGame(false, winningCombo);
    return;
  }

  if (isBoardFull()) {
    endGame(true, null);
    return;
  }

  switchTurn();
}

/* ---------------------------------------------------------
   Returns the winning combination array if there is one,
   otherwise returns null
   --------------------------------------------------------- */
function getWinningCombination() {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (
      boardState[a] !== "" &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      return combo;
    }
  }
  return null;
}

/* ---------------------------------------------------------
   Check if the board is completely full (draw condition)
   --------------------------------------------------------- */
function isBoardFull() {
  return boardState.every(cell => cell !== "");
}

/* ---------------------------------------------------------
   Switch turn between X and O
   --------------------------------------------------------- */
function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatusDisplay(`Player ${currentPlayer}'s Turn`);
}

/* ---------------------------------------------------------
   End the game (win or draw) and update the UI
   --------------------------------------------------------- */
function endGame(isDraw, winningCombo) {
  gameActive = false;

  if (isDraw) {
    updateStatusDisplay("It's a Draw!", "draw");
  } else {
    updateStatusDisplay(`Player ${currentPlayer} Wins! 🎉`, "winner");
    highlightWinningSquares(winningCombo);
  }
}

/* ---------------------------------------------------------
   Highlight the three winning squares
   --------------------------------------------------------- */
function highlightWinningSquares(combo) {
  combo.forEach(index => {
    squares[index].classList.add("winning");
  });
}

/* ---------------------------------------------------------
   Update the status text and optional styling class
   --------------------------------------------------------- */
function updateStatusDisplay(message, statusClass) {
  statusText.textContent = message;
  statusText.classList.remove("winner", "draw");

  if (statusClass) {
    statusText.classList.add(statusClass);
  }
}

/* ---------------------------------------------------------
   Reset the game to its initial state
   --------------------------------------------------------- */
function resetGame() {
  boardState = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;

  squares.forEach(square => {
    square.textContent = "";
    square.classList.remove("taken", "x-mark", "o-mark", "winning");
  });

  updateStatusDisplay(`Player ${currentPlayer}'s Turn`);
}

/* ---------------------------------------------------------
   Start everything once the page loads
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", initGame);
