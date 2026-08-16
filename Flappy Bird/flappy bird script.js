const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("start-button");
const scoreDisplay = document.getElementById("score");

// Game settings
const gravity = 0.45;
const jumpStrength = -7.5;
const pipeSpeed = 2.5;
const pipeWidth = 60;
const pipeGap = 160;

// Bird
const bird = {
    x: 80,
    y: 250,
    width: 30,
    height: 30,
    velocity: 0
};

let pipes = [];
let score = 0;
let gameRunning = false;
let gameOver = false;
let animationId;

// Start / restart game
startButton.addEventListener("click", () => {
    startGame();
});

function startGame() {
    cancelAnimationFrame(animationId);

    bird.y = 250;
    bird.velocity = 0;

    pipes = [];
    score = 0;

    gameRunning = true;
    gameOver = false;

    scoreDisplay.textContent = "Score: 0";
    startButton.textContent = "Restart Game";

    // Create the first pipes
    createPipe();

    gameLoop();
}

// Make the bird jump
function jump() {
    if (!gameRunning) return;

    bird.velocity = jumpStrength;
}

// Keyboard controls
document.addEventListener("keydown", (event) => {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
    ) {
        event.preventDefault();
        jump();
    }
});

// Mouse / touch controls
canvas.addEventListener("mousedown", () => {
    jump();
});

canvas.addEventListener(
    "touchstart",
    (event) => {
        event.preventDefault();
        jump();
    },
    { passive: false }
);

// Create a pipe
function createPipe() {
    const minTopHeight = 80;
    const maxTopHeight = canvas.height - pipeGap - 80;

    const topHeight =
        Math.floor(
            Math.random() * (maxTopHeight - minTopHeight + 1)
        ) + minTopHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false
    });
}

// Update game
function update() {
    // Bird physics
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Create new pipes
    if (
        pipes.length === 0 ||
        pipes[pipes.length - 1].x < canvas.width - 220
    ) {
        createPipe();
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];

        pipe.x -= pipeSpeed;

        // Score when bird passes pipe
        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            score++;

            scoreDisplay.textContent = `Score: ${score}`;
        }

        // Remove pipes that are off screen
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    // Check collisions
    checkCollision();
}

// Collision detection
function checkCollision() {
    // Top and bottom of screen
    if (
        bird.y < 0 ||
        bird.y + bird.height > canvas.height
    ) {
        endGame();
        return;
    }

    // Pipes
    for (const pipe of pipes) {
        const hitPipe =
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (
                bird.y < pipe.topHeight ||
                bird.y + bird.height >
                    pipe.topHeight + pipeGap
            );

        if (hitPipe) {
            endGame();
            return;
        }
    }
}

// Draw everything
function draw() {
    // Sky
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    drawCloud(70, 100);
    drawCloud(280, 180);

    // Pipes
    for (const pipe of pipes) {
        drawPipe(pipe);
    }

    // Ground
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    ctx.fillStyle = "#8bc34a";
    ctx.fillRect(0, canvas.height - 30, canvas.width, 8);

    // Bird
    drawBird();

    // Game over screen
    if (gameOver) {
        drawGameOver();
    }
}

// Draw bird
function drawBird() {
    // Body
    ctx.fillStyle = "#f7d046";
    ctx.fillRect(
        bird.x,
        bird.y,
        bird.width,
        bird.height
    );

    // Wing
    ctx.fillStyle = "#e5b93c";
    ctx.fillRect(
        bird.x - 5,
        bird.y + 15,
        15,
        10
    );

    // Eye
    ctx.fillStyle = "white";
    ctx.fillRect(
        bird.x + 19,
        bird.y + 5,
        8,
        8
    );

    ctx.fillStyle = "black";
    ctx.fillRect(
        bird.x + 23,
        bird.y + 7,
        4,
        4
    );

    // Beak
    ctx.fillStyle = "#f28c28";
    ctx.fillRect(
        bird.x + bird.width,
        bird.y + 12,
        10,
        7
    );
}

// Draw pipes
function drawPipe(pipe) {
    ctx.fillStyle = "#4caf50";

    // Top pipe
    ctx.fillRect(
        pipe.x,
        0,
        pipeWidth,
        pipe.topHeight
    );

    // Top pipe lip
    ctx.fillStyle = "#43a047";
    ctx.fillRect(
        pipe.x - 5,
        pipe.topHeight - 20,
        pipeWidth + 10,
        20
    );

    // Bottom pipe
    const bottomY = pipe.topHeight + pipeGap;

    ctx.fillStyle = "#4caf50";
    ctx.fillRect(
        pipe.x,
        bottomY,
        pipeWidth,
        canvas.height - bottomY
    );

    // Bottom pipe lip
    ctx.fillStyle = "#43a047";
    ctx.fillRect(
        pipe.x - 5,
        bottomY,
        pipeWidth + 10,
        20
    );
}

// Draw clouds
function drawCloud(x, y) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Game over
function endGame() {
    gameRunning = false;
    gameOver = true;

    draw();

    startButton.textContent = "Play Again";
}

// Game over screen
function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "bold 42px Arial";
    ctx.fillText(
        "Game Over",
        canvas.width / 2,
        canvas.height / 2 - 30
    );

    ctx.font = "24px Arial";
    ctx.fillText(
        `Score: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 15
    );

    ctx.font = "18px Arial";
    ctx.fillText(
        "Press Play Again",
        canvas.width / 2,
        canvas.height / 2 + 55
    );

    ctx.textAlign = "left";
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

// Draw initial screen
draw();