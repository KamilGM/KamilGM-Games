"use strict";

const BOARD_SIZE = 8;
const PIECE_COUNT = 3;

const boardElement = document.getElementById("board");
const piecesElement = document.getElementById("pieces");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const linesElement = document.getElementById("lines");
const finalScoreElement = document.getElementById("finalScore");

const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const resumeButton = document.getElementById("resumeButton");
const gameOverRestart = document.getElementById("gameOverRestart");

const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const COLORS = [
    "green",
    "blue",
    "purple",
    "orange",
    "pink",
    "cyan",
    "yellow"
];

const SHAPES = [
    [[1]],

    [[1, 1]],
    [[1], [1]],

    [[1, 1, 1]],
    [[1], [1], [1]],

    [
        [1, 1],
        [1, 1]
    ],

    [
        [1, 0],
        [1, 1]
    ],

    [
        [0, 1],
        [1, 1]
    ],

    [
        [1, 1],
        [1, 0]
    ],

    [
        [1, 1],
        [0, 1]
    ],

    [
        [1, 0],
        [1, 1],
        [0, 1]
    ],

    [
        [0, 1],
        [1, 1],
        [1, 0]
    ],

    [
        [1, 1, 1],
        [0, 1, 0]
    ],

    [
        [0, 1, 0],
        [1, 1, 1]
    ],

    [
        [1, 1, 1],
        [1, 0, 1]
    ],

    [
        [1, 0, 1],
        [1, 1, 1]
    ],

    [
        [1, 1, 0],
        [0, 1, 1]
    ],

    [
        [0, 1, 1],
        [1, 1, 0]
    ],

    [
        [1, 1, 1, 1]
    ],

    [
        [1],
        [1],
        [1],
        [1]
    ],

    [
        [1, 1, 1],
        [1, 1, 1]
    ],

    [
        [1, 1],
        [1, 1],
        [1, 1]
    ],

    [
        [1, 1, 0],
        [1, 1, 1]
    ],

    [
        [0, 1, 1],
        [1, 1, 1]
    ]
];

let board = [];
let pieces = [];

let score = 0;
let bestScore =
    Number(localStorage.getItem("blockSpaceBest")) || 0;

let linesCleared = 0;

let paused = false;
let gameOver = false;

let dragging = null;
let pointerId = null;
let preview = null;

function createBoard() {
    board = Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(null)
    );

    boardElement.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement("div");

            cell.className = "cell";

            cell.dataset.row = row;
            cell.dataset.col = col;

            boardElement.appendChild(cell);
        }
    }
}

function createPiece() {
    const shape =
        SHAPES[
            Math.floor(Math.random() * SHAPES.length)
        ].map(row => [...row]);

    return {
        shape,
        color:
            COLORS[
                Math.floor(Math.random() * COLORS.length)
            ],
        used: false
    };
}

function generatePieces() {
    pieces = [];

    for (let i = 0; i < PIECE_COUNT; i++) {
        pieces.push(createPiece());
    }

    renderPieces();
}

function renderPieces() {
    piecesElement.innerHTML = "";

    pieces.forEach((piece, index) => {
        const pieceElement =
            document.createElement("div");

        pieceElement.className = "piece";

        if (piece.used) {
            pieceElement.classList.add("used");
        }

        const miniGrid =
            document.createElement("div");

        miniGrid.className = "miniGrid";

        const height = piece.shape.length;
        const width = piece.shape[0].length;

        miniGrid.style.gridTemplateColumns =
            `repeat(${width}, 21px)`;

        miniGrid.style.gridTemplateRows =
            `repeat(${height}, 21px)`;

        piece.shape.forEach(row => {
            row.forEach(value => {
                const miniCell =
                    document.createElement("div");

                if (value) {
                    miniCell.className =
                        `miniCell block ${piece.color}`;
                } else {
                    miniCell.className =
                        "miniCell empty";
                }

                miniGrid.appendChild(miniCell);
            });
        });

        pieceElement.appendChild(miniGrid);

        piecesElement.appendChild(pieceElement);

        if (!piece.used) {
            pieceElement.addEventListener(
                "pointerdown",
                event => {
                    startDrag(
                        event,
                        index,
                        pieceElement
                    );
                }
            );
        }
    });
}

function renderBoard() {
    const cells = boardElement.children;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell =
                cells[row * BOARD_SIZE + col];

            cell.className = "cell";

            if (board[row][col]) {
                cell.classList.add("filled");
                cell.classList.add(board[row][col]);
            }
        }
    }
}

function startDrag(event, index, element) {
    if (
        paused ||
        gameOver ||
        pieces[index].used
    ) {
        return;
    }

    event.preventDefault();

    pointerId = event.pointerId;

    dragging = {
        index,
        piece: pieces[index],
        element
    };

    element.classList.add("dragging");

    try {
        element.setPointerCapture(pointerId);
    } catch (_) {}

    updatePreview(
        event.clientX,
        event.clientY
    );

    window.addEventListener(
        "pointermove",
        handlePointerMove,
        { passive: false }
    );

    window.addEventListener(
        "pointerup",
        handlePointerUp,
        { once: true }
    );

    window.addEventListener(
        "pointercancel",
        handlePointerUp,
        { once: true }
    );
}

function handlePointerMove(event) {
    if (
        !dragging ||
        event.pointerId !== pointerId
    ) {
        return;
    }

    event.preventDefault();

    updatePreview(
        event.clientX,
        event.clientY
    );
}

function handlePointerUp(event) {
    if (
        !dragging ||
        event.pointerId !== pointerId
    ) {
        return;
    }

    const currentDrag = dragging;

    const currentPreview = preview;

    clearPreview();

    currentDrag.element.classList.remove(
        "dragging"
    );

    if (
        currentPreview &&
        currentPreview.valid
    ) {
        placePiece(
            currentDrag.index,
            currentPreview.row,
            currentPreview.col
        );
    }

    dragging = null;
    pointerId = null;
    preview = null;

    window.removeEventListener(
        "pointermove",
        handlePointerMove
    );
}

function updatePreview(clientX, clientY) {
    clearPreview();

    if (!dragging) {
        return;
    }

    const boardRect =
        boardElement.getBoundingClientRect();

    if (
        clientX < boardRect.left ||
        clientX > boardRect.right ||
        clientY < boardRect.top ||
        clientY > boardRect.bottom
    ) {
        preview = null;
        return;
    }

    const piece = dragging.piece;
    const shape = piece.shape;

    const cellWidth =
        boardRect.width / BOARD_SIZE;

    const cellHeight =
        boardRect.height / BOARD_SIZE;

    const x =
        clientX - boardRect.left;

    const y =
        clientY - boardRect.top;

    const centerCol =
        Math.floor(x / cellWidth);

    const centerRow =
        Math.floor(y / cellHeight);

    const shapeWidth =
        shape[0].length;

    const shapeHeight =
        shape.length;

    let firstFilledRow =
        shapeHeight;

    let firstFilledCol =
        shapeWidth;

    for (
        let row = 0;
        row < shapeHeight;
        row++
    ) {
        for (
            let col = 0;
            col < shapeWidth;
            col++
        ) {
            if (shape[row][col]) {
                firstFilledRow =
                    Math.min(
                        firstFilledRow,
                        row
                    );

                firstFilledCol =
                    Math.min(
                        firstFilledCol,
                        col
                    );
            }
        }
    }

    const startRow =
        centerRow -
        Math.floor(shapeHeight / 2) -
        firstFilledRow +
        1;

    const startCol =
        centerCol -
        Math.floor(shapeWidth / 2) -
        firstFilledCol +
        1;

    const valid =
        canPlace(
            shape,
            startRow,
            startCol
        );

    preview = {
        row: startRow,
        col: startCol,
        valid
    };

    for (
        let row = 0;
        row < shapeHeight;
        row++
    ) {
        for (
            let col = 0;
            col < shapeWidth;
            col++
        ) {
            if (!shape[row][col]) {
                continue;
            }

            const boardRow =
                startRow + row;

            const boardCol =
                startCol + col;

            if (
                boardRow >= 0 &&
                boardRow < BOARD_SIZE &&
                boardCol >= 0 &&
                boardCol < BOARD_SIZE
            ) {
                const cell =
                    boardElement.children[
                        boardRow * BOARD_SIZE +
                        boardCol
                    ];

                cell.classList.add(
                    valid
                        ? "preview"
                        : "invalidPreview"
                );
            }
        }
    }
}

function clearPreview() {
    const cells =
        boardElement.querySelectorAll(
            ".preview, .invalidPreview"
        );

    cells.forEach(cell => {
        cell.classList.remove(
            "preview",
            "invalidPreview"
        );
    });
}

function canPlace(
    shape,
    startRow,
    startCol
) {
    for (
        let row = 0;
        row < shape.length;
        row++
    ) {
        for (
            let col = 0;
            col < shape[row].length;
            col++
        ) {
            if (!shape[row][col]) {
                continue;
            }

            const boardRow =
                startRow + row;

            const boardCol =
                startCol + col;

            if (
                boardRow < 0 ||
                boardRow >= BOARD_SIZE ||
                boardCol < 0 ||
                boardCol >= BOARD_SIZE
            ) {
                return false;
            }

            if (board[boardRow][boardCol]) {
                return false;
            }
        }
    }

    return true;
}

function placePiece(
    index,
    startRow,
    startCol
) {
    const piece = pieces[index];

    if (
        !canPlace(
            piece.shape,
            startRow,
            startCol
        )
    ) {
        return;
    }

    for (
        let row = 0;
        row < piece.shape.length;
        row++
    ) {
        for (
            let col = 0;
            col < piece.shape[row].length;
            col++
        ) {
            if (piece.shape[row][col]) {
                board[
                    startRow + row
                ][
                    startCol + col
                ] = piece.color;
            }
        }
    }

    piece.used = true;

    const blockCount =
        piece.shape
            .flat()
            .filter(Boolean)
            .length;

    addScore(blockCount * 2);

    renderBoard();
    renderPieces();

    const cleared =
        findCompletedLines();

    if (
        cleared.rows.length ||
        cleared.cols.length
    ) {
        animateClear(cleared);
    } else {
        checkForNewSet();
    }
}

function findCompletedLines() {
    const rows = [];
    const cols = [];

    for (
        let row = 0;
        row < BOARD_SIZE;
        row++
    ) {
        let complete = true;

        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {
            if (!board[row][col]) {
                complete = false;
                break;
            }
        }

        if (complete) {
            rows.push(row);
        }
    }

    for (
        let col = 0;
        col < BOARD_SIZE;
        col++
    ) {
        let complete = true;

        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {
            if (!board[row][col]) {
                complete = false;
                break;
            }
        }

        if (complete) {
            cols.push(col);
        }
    }

    return {
        rows,
        cols
    };
}

function animateClear(cleared) {
    const cellsToClear = new Set();

    cleared.rows.forEach(row => {
        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {
            cellsToClear.add(
                `${row},${col}`
            );
        }
    });

    cleared.cols.forEach(col => {
        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {
            cellsToClear.add(
                `${row},${col}`
            );
        }
    });

    cellsToClear.forEach(key => {
        const [row, col] =
            key.split(",").map(Number);

        const cell =
            boardElement.children[
                row * BOARD_SIZE + col
            ];

        cell.classList.add("clearing");
    });

    const lineCount =
        cleared.rows.length +
        cleared.cols.length;

    const uniqueCells =
        cellsToClear.size;

    const basePoints =
        uniqueCells * 10;

    const lineBonus =
        lineCount * lineCount * 40;

    const multiBonus =
        lineCount > 1
            ? (lineCount - 1) * 100
            : 0;

    const points =
        basePoints +
        lineBonus +
        multiBonus;

    linesCleared += lineCount;

    addScore(points);

    showScorePopup(`+${points}`);

    setTimeout(() => {
        cellsToClear.forEach(key => {
            const [row, col] =
                key.split(",").map(Number);

            board[row][col] = null;
        });

        renderBoard();

        checkForNewSet();
    }, 350);
}

function addScore(amount) {
    score += amount;

    if (score > bestScore) {
        bestScore = score;

        localStorage.setItem(
            "blockSpaceBest",
            bestScore
        );
    }

    updateStats();
}

function updateStats() {
    scoreElement.textContent = score;
    bestElement.textContent = bestScore;
    linesElement.textContent = linesCleared;
}

function showScorePopup(text) {
    const popup =
        document.createElement("div");

    popup.className = "scorePopup";
    popup.textContent = text;

    popup.style.left = "50%";
    popup.style.top = "45%";

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 850);
}

function checkForNewSet() {
    if (
        pieces.every(piece => piece.used)
    ) {
        generatePieces();
        return;
    }

    if (!hasAnyMove()) {
        endGame();
    }
}

function hasAnyMove() {
    for (const piece of pieces) {
        if (piece.used) {
            continue;
        }

        for (
            let row = 0;
            row < BOARD_SIZE;
            row++
        ) {
            for (
                let col = 0;
                col < BOARD_SIZE;
                col++
            ) {
                if (
                    canPlace(
                        piece.shape,
                        row,
                        col
                    )
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

function togglePause() {
    if (gameOver) {
        return;
    }

    paused = !paused;

    pauseOverlay.classList.toggle(
        "hidden",
        !paused
    );

    pauseButton.textContent =
        paused ? "▶" : "Ⅱ";
}

function endGame() {
    gameOver = true;

    finalScoreElement.textContent =
        score;

    gameOverOverlay.classList.remove(
        "hidden"
    );
}

function restartGame() {
    score = 0;
    linesCleared = 0;
    paused = false;
    gameOver = false;

    pauseOverlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");

    pauseButton.textContent = "Ⅱ";

    createBoard();
    generatePieces();
    updateStats();
}

pauseButton.addEventListener(
    "click",
    togglePause
);

restartButton.addEventListener(
    "click",
    restartGame
);

resumeButton.addEventListener(
    "click",
    togglePause
);

gameOverRestart.addEventListener(
    "click",
    restartGame
);

window.addEventListener(
    "resize",
    () => {
        if (dragging) {
            clearPreview();
        }
    }
);

createBoard();
generatePieces();
updateStats();
