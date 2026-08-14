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

    [[1, 1, 1, 1]],

    [[1], [1], [1], [1]],

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


/* =========================
   CREATE BOARD
========================= */

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


/* =========================
   CREATE PIECE
========================= */

function createPiece() {

    const shape =
        SHAPES[
            Math.floor(Math.random() * SHAPES.length)
        ].map(row => [...row]);

    return {
        shape: shape,

        color:
            COLORS[
                Math.floor(Math.random() * COLORS.length)
            ],

        used: false
    };
}


/* =========================
   GENERATE PIECES
========================= */

function generatePieces() {

    pieces = [];

    for (let i = 0; i < PIECE_COUNT; i++) {
        pieces.push(createPiece());
    }

    renderPieces();
}


/* =========================
   RENDER PIECES
========================= */

function renderPieces() {

    piecesElement.innerHTML = "";

    pieces.forEach((piece, index) => {

        const pieceElement =
            document.createElement("div");

        pieceElement.className = "piece";

        if (piece.used) {
            pieceElement.classList.add("used");
        }

        pieceElement.dataset.index = index;

        const height = piece.shape.length;
        const width = piece.shape[0].length;

        const miniGrid =
            document.createElement("div");

        miniGrid.className = "miniGrid";

        miniGrid.style.gridTemplateColumns =
            `repeat(${width}, 27px)`;

        miniGrid.style.gridTemplateRows =
            `repeat(${height}, 27px)`;

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


/* =========================
   RENDER BOARD
========================= */

function renderBoard() {

    const cells = boardElement.children;

    for (let row = 0; row < BOARD_SIZE; row++) {

        for (let col = 0; col < BOARD_SIZE; col++) {

            const cell =
                cells[
                    row * BOARD_SIZE + col
                ];

            cell.className = "cell";

            if (board[row][col]) {

                cell.classList.add("filled");

                cell.classList.add(
                    board[row][col]
                );
            }
        }
    }
}


/* =========================
   START DRAG
========================= */

function startDrag(
    event,
    index,
    element
) {

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
        index: index,
        piece: pieces[index],
        element: element
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
        {
            passive: false
        }
    );

    window.addEventListener(
        "pointerup",
        handlePointerUp,
        {
            once: true
        }
    );

    window.addEventListener(
        "pointercancel",
        handlePointerUp,
        {
            once: true
        }
    );
}


/* =========================
   POINTER MOVE
========================= */

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


/* =========================
   POINTER UP
========================= */

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


/* =========================
   UPDATE PREVIEW
========================= */

function updatePreview(
    clientX,
    clientY
) {

    clearPreview();

    if (!dragging) {
        return;
    }

    const boardRect =
        boardElement.getBoundingClientRect();

    const cellWidth =
        boardRect.width / BOARD_SIZE;

    const cellHeight =
        boardRect.height / BOARD_SIZE;

    const shape =
        dragging.piece.shape;

    const shapeHeight =
        shape.length;

    const shapeWidth =
        shape[0].length;


    /*
        Find the real occupied edges
        of the shape.
    */

    let firstRow = shapeHeight;
    let firstCol = shapeWidth;

    let lastRow = -1;
    let lastCol = -1;

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

            firstRow =
                Math.min(
                    firstRow,
                    row
                );

            firstCol =
                Math.min(
                    firstCol,
                    col
                );

            lastRow =
                Math.max(
                    lastRow,
                    row
                );

            lastCol =
                Math.max(
                    lastCol,
                    col
                );
        }
    }


    /*
        The pointer is allowed to be anywhere.

        It does NOT matter if it is outside
        the visible 8 x 8 board.
    */

    const pointerX =
        clientX -
        boardRect.left;

    const pointerY =
        clientY -
        boardRect.top;


    /*
        Convert pointer to a board position.
    */

    let pointerCol =
        Math.floor(
            pointerX / cellWidth
        );

    let pointerRow =
        Math.floor(
            pointerY / cellHeight
        );


    /*
        Position the piece around the pointer.
    */

    let startCol =
        pointerCol -
        Math.floor(shapeWidth / 2);

    let startRow =
        pointerRow -
        Math.floor(shapeHeight / 2);


    /*
        ==================================================
        INVISIBLE AREA / EDGE SNAP
        ==================================================

        These limits mean the piece can never be
        positioned outside the actual 8 x 8 board.

        If the pointer goes outside, the piece simply
        stays at the closest possible edge.
    */

    const minimumCol =
        -firstCol;

    const maximumCol =
        BOARD_SIZE -
        1 -
        lastCol;

    const minimumRow =
        -firstRow;

    const maximumRow =
        BOARD_SIZE -
        1 -
        lastRow;


    /*
        LEFT EDGE
    */

    if (startCol < minimumCol) {
        startCol = minimumCol;
    }


    /*
        RIGHT EDGE
    */

    if (startCol > maximumCol) {
        startCol = maximumCol;
    }


    /*
        TOP EDGE
    */

    if (startRow < minimumRow) {
        startRow = minimumRow;
    }


    /*
        BOTTOM EDGE
    */

    if (startRow > maximumRow) {
        startRow = maximumRow;
    }


    /*
        Check whether the snapped position
        is actually available.
    */

    const valid =
        canPlace(
            shape,
            startRow,
            startCol
        );


    preview = {
        row: startRow,
        col: startCol,
        valid: valid
    };


    /*
        Draw preview.
    */

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


            /*
                Never draw outside the real board.
            */

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


/* =========================
   CLEAR PREVIEW
========================= */

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


/* =========================
   CHECK PLACEMENT
========================= */

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


            /*
                Outside the board = impossible.
            */

            if (
                boardRow < 0 ||
                boardRow >= BOARD_SIZE ||
                boardCol < 0 ||
                boardCol >= BOARD_SIZE
            ) {

                return false;
            }


            /*
                Existing block = impossible.
            */

            if (board[boardRow][boardCol]) {
                return false;
            }
        }
    }

    return true;
}


/* =========================
   PLACE PIECE
========================= */

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


    /*
        Put every occupied shape cell
        onto the board.
    */

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


    /*
        Basic placement score.
    */

    const blockCount =
        piece.shape
            .flat()
            .filter(Boolean)
            .length;

    addScore(
        blockCount * 2
    );


    renderBoard();
    renderPieces();


    /*
        Check completed rows and columns.
    */

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


/* =========================
   FIND COMPLETED LINES
========================= */

function findCompletedLines() {

    const rows = [];
    const cols = [];


    /*
        Rows.
    */

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


    /*
        Columns.
    */

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
        rows: rows,
        cols: cols
    };
}


/* =========================
   ANIMATE CLEAR
========================= */

function animateClear(cleared) {

    const cellsToClear =
        new Set();


    /*
        Add complete rows.
    */

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


    /*
        Add complete columns.
    */

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


    /*
        Animate them.
    */

    cellsToClear.forEach(key => {

        const [
            row,
            col
        ] =
            key
                .split(",")
                .map(Number);

        const cell =
            boardElement.children[
                row * BOARD_SIZE + col
            ];

        cell.classList.add(
            "clearing"
        );
    });


    const lineCount =
        cleared.rows.length +
        cleared.cols.length;

    const uniqueCells =
        cellsToClear.size;


    /*
        Scoring.
    */

    const basePoints =
        uniqueCells * 10;

    const lineBonus =
        lineCount *
        lineCount *
        40;

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

    showScorePopup(
        `+${points}`
    );


    /*
        Actually remove the cells
        after the animation.
    */

    setTimeout(() => {

        cellsToClear.forEach(key => {

            const [
                row,
                col
            ] =
                key
                    .split(",")
                    .map(Number);

            board[row][col] = null;
        });


        renderBoard();

        checkForNewSet();

    }, 350);
}


/* =========================
   SCORE
========================= */

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

    scoreElement.textContent =
        score;

    bestElement.textContent =
        bestScore;

    linesElement.textContent =
        linesCleared;
}


/* =========================
   SCORE POPUP
========================= */

function showScorePopup(text) {

    const popup =
        document.createElement("div");

    popup.className =
        "scorePopup";

    popup.textContent =
        text;

    popup.style.left =
        "50%";

    popup.style.top =
        "45%";

    document.body.appendChild(
        popup
    );


    setTimeout(() => {

        popup.remove();

    }, 850);
}


/* =========================
   CHECK FOR NEW PIECES
========================= */

function checkForNewSet() {

    /*
        All three pieces have been used.
    */

    if (
        pieces.every(
            piece => piece.used
        )
    ) {

        generatePieces();

        return;
    }


    /*
        If none of the remaining pieces
        can fit anywhere, game over.
    */

    if (!hasAnyMove()) {
        endGame();
    }
}


/* =========================
   CHECK POSSIBLE MOVES
========================= */

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


/* =========================
   PAUSE
========================= */

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
        paused
            ? "▶"
            : "Ⅱ";
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameOver = true;

    finalScoreElement.textContent =
        score;

    gameOverOverlay.classList.remove(
        "hidden"
    );
}


/* =========================
   RESTART
========================= */

function restartGame() {

    score = 0;

    linesCleared = 0;

    paused = false;

    gameOver = false;

    dragging = null;

    pointerId = null;

    preview = null;


    pauseOverlay.classList.add(
        "hidden"
    );

    gameOverOverlay.classList.add(
        "hidden"
    );


    pauseButton.textContent =
        "Ⅱ";


    createBoard();

    generatePieces();

    updateStats();
}


/* =========================
   BUTTONS
========================= */

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


/* =========================
   START GAME
========================= */

createBoard();

generatePieces();

updateStats();
