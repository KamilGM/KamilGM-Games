const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const settingsButton = document.getElementById("settings-button");
const closeSettings = document.getElementById("close-settings");
const settingsMenu = document.getElementById("settings-menu");

const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("final-score");

const difficultySelect = document.getElementById("difficulty");
const oppositeSwipesCheckbox = document.getElementById("opposite-swipes");

const GRID_SIZE = 20;

let snake = [];
let food = {};

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let gameRunning = false;
let gameLoop = null;

let difficulty = "normal";
let oppositeSwipes = false;

let touchStartX = 0;
let touchStartY = 0;


// ==========================
// CANVAS SIZE
// ==========================

function resizeCanvas() {
    const maxSize = Math.min(
        window.innerWidth - 30,
        window.innerHeight - 180,
        500
    );

    const size = Math.max(240, maxSize);

    canvas.width = size;
    canvas.height = size;

    draw();
}

window.addEventListener("resize", resizeCanvas);


// ==========================
// DIFFICULTY
// ==========================

function getSpeed() {
    if (difficulty === "easy") {
        return 180;
    }

    if (difficulty === "hard") {
        return 80;
    }

    return 120;
}


// ==========================
// START GAME
// ==========================

function startGame() {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");

    score = 0;

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    updateScore();
    createFood();

    gameRunning = true;

    clearInterval(gameLoop);

    gameLoop = setInterval(updateGame, getSpeed());

    resizeCanvas();
}


// ==========================
// RESTART GAME
// ==========================

function restartGame() {
    startGame();
}


// ==========================
// SCORE
// ==========================

function updateScore() {
    scoreDisplay.textContent = "Score: " + score;
}


// ==========================
// CREATE FOOD
// ==========================

function createFood() {
    const maxCells = Math.floor(canvas.width / GRID_SIZE);

    do {
        food = {
            x: Math.floor(Math.random() * maxCells),
            y: Math.floor(Math.random() * maxCells)
        };
    } while (
        snake.some(
            segment =>
                segment.x === food.x &&
                segment.y === food.y
        )
    );
}


// ==========================
// UPDATE GAME
// ==========================

function updateGame() {
    if (!gameRunning) {
        return;
    }

    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    const maxCells = Math.floor(canvas.width / GRID_SIZE);


    // Wall collision
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= maxCells ||
        head.y >= maxCells
    ) {
        endGame();
        return;
    }


    // Snake collision
    if (
        snake.some(
            segment =>
                segment.x === head.x &&
                segment.y === head.y
        )
    ) {
        endGame();
        return;
    }


    // Add new head
    snake.unshift(head);


    // Food
    if (
        head.x === food.x &&
        head.y === food.y
    ) {
        score++;

        updateScore();

        createFood();
    } else {
        snake.pop();
    }


    draw();
}


// ==========================
// DRAW GAME
// ==========================

function draw() {
    const cells = Math.floor(canvas.width / GRID_SIZE);
    const cellSize = canvas.width / cells;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Background
    ctx.fillStyle = "#111111";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Food
    ctx.fillStyle = "#ff3333";

    ctx.fillRect(
        food.x * cellSize,
        food.y * cellSize,
        cellSize - 1,
        cellSize - 1
    );


    // Snake
    snake.forEach((segment, index) => {

        if (index === 0) {
            ctx.fillStyle = "#66ff66";
        } else {
            ctx.fillStyle = "#32cd32";
        }

        ctx.fillRect(
            segment.x * cellSize,
            segment.y * cellSize,
            cellSize - 1,
            cellSize - 1
        );
    });
}


// ==========================
// CHANGE DIRECTION
// ==========================

function changeDirection(newDirection) {

    if (!gameRunning) {
        return;
    }


    // Prevent instant 180-degree turns
    if (
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y
    ) {
        return;
    }


    nextDirection = newDirection;
}


// ==========================
// KEYBOARD CONTROLS
// ==========================

document.addEventListener("keydown", event => {

    let newDirection = null;

    switch (event.key.toLowerCase()) {

        case "arrowup":
        case "w":
            newDirection = {
                x: 0,
                y: -1
            };
            break;

        case "arrowdown":
        case "s":
            newDirection = {
                x: 0,
                y: 1
            };
            break;

        case "arrowleft":
        case "a":
            newDirection = {
                x: -1,
                y: 0
            };
            break;

        case "arrowright":
        case "d":
            newDirection = {
                x: 1,
                y: 0
            };
            break;
    }


    if (newDirection !== null) {
        event.preventDefault();

        changeDirection(newDirection);
    }
});


// ==========================
// MOBILE SWIPES
// ==========================

canvas.addEventListener(
    "touchstart",
    event => {

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    },
    { passive: true }
);


canvas.addEventListener(
    "touchend",
    event => {

        const touch = event.changedTouches[0];

        const deltaX =
            touch.clientX - touchStartX;

        const deltaY =
            touch.clientY - touchStartY;

        const minimumSwipe = 25;


        // Ignore tiny movements
        if (
            Math.abs(deltaX) < minimumSwipe &&
            Math.abs(deltaY) < minimumSwipe
        ) {
            return;
        }


        let newDirection;


        // Horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {

            if (deltaX > 0) {

                newDirection = {
                    x: 1,
                    y: 0
                };

            } else {

                newDirection = {
                    x: -1,
                    y: 0
                };
            }

        }

        // Vertical swipe
        else {

            if (deltaY > 0) {

                newDirection = {
                    x: 0,
                    y: 1
                };

            } else {

                newDirection = {
                    x: 0,
                    y: -1
                };
            }
        }


        // Reverse swipe directions if enabled
        if (oppositeSwipes) {

            newDirection = {
                x: -newDirection.x,
                y: -newDirection.y
            };
        }


        changeDirection(newDirection);

    },
    { passive: true }
);


// Prevent mobile page scrolling
canvas.addEventListener(
    "touchmove",
    event => {
        event.preventDefault();
    },
    { passive: false }
);


// ==========================
// GAME OVER
// ==========================

function endGame() {

    gameRunning = false;

    clearInterval(gameLoop);

    finalScore.textContent =
        "Score: " + score;

    gameOverScreen.classList.remove("hidden");
}


// ==========================
// BUTTONS
// ==========================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    restartGame
);


// ==========================
// SETTINGS
// ==========================

settingsButton.addEventListener(
    "click",
    () => {
        settingsMenu.classList.remove("hidden");
    }
);


closeSettings.addEventListener(
    "click",
    () => {
        settingsMenu.classList.add("hidden");
    }
);


// ==========================
// DIFFICULTY SETTING
// ==========================

difficultySelect.addEventListener(
    "change",
    () => {

        difficulty = difficultySelect.value;


        // Update speed immediately
        if (gameRunning) {

            clearInterval(gameLoop);

            gameLoop = setInterval(
                updateGame,
                getSpeed()
            );
        }
    }
);


// ==========================
// OPPOSITE SWIPES SETTING
// ==========================

oppositeSwipesCheckbox.addEventListener(
    "change",
    () => {

        oppositeSwipes =
            oppositeSwipesCheckbox.checked;
    }
);


// ==========================
// INITIAL SETUP
// ==========================

resizeCanvas();