"use strict";

const COMP_DELAY = 0.5; 
const GAME_DELAY = 2; 
const FRAME_RATE = 30; 
let GRID_DIM = 5; 
const CANVAS_HEIGHT = 550; 

const CANVAS_WIDTH = CANVAS_HEIGHT * 0.9;
let CELL_SIZE = CANVAS_WIDTH / (GRID_DIM + 2);
const LINE_WIDTH = CELL_SIZE / 12;
const DOT_RADIUS = LINE_WIDTH;
let TOP_MARGIN = CANVAS_HEIGHT - (GRID_DIM + 1) * CELL_SIZE;

const BG_COLOR = "cornsilk";
const BORDER_COLOR = "wheat";
const COMP_COLOR = "crimson";
const COMP_HIGHLIGHT_COLOR = "lightpink";
const DOT_COLOR = "sienna";
const PLAYER_COLOR = "royalblue";
const PLAYER_HIGHLIGHT_COLOR = "lightsteelblue";
const TIE_COLOR = "black";

const COMP_TEXT = "Computer";
const COMP_TEXT_SMALL = "Comp";
const PLAYER_TEXT = "Player";
const PLAYER_TEXT_SMALL = "Play";
const CELL_TEXT_SIZE = CELL_SIZE / 3;
const TOP_TEXT_SIZE = TOP_MARGIN / 6;
const TIE_TEXT = "DRAW!";
const WIN_TEXT = "WINS!";

const Side = {
    BOTTOM: 0,
    LEFT: 1,
    RIGHT: 2,
    TOP: 3
}

const canvas = document.createElement("canvas");
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;
document.body.appendChild(canvas);
const canvasRect = canvas.getBoundingClientRect();

const ctx = canvas.getContext("2d");
ctx.lineWidth = LINE_WIDTH;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

let activeCells, isPlayerTurn, gridSquares;
let compScore, playerScore;
let compTime, endTime;

document.getElementById("gridSize").addEventListener("change", function() {
    GRID_DIM = parseInt(this.value);
    CELL_SIZE = CANVAS_WIDTH / (GRID_DIM + 2);
    TOP_MARGIN = CANVAS_HEIGHT - (GRID_DIM + 1) * CELL_SIZE;
    startNewGame();
});

startNewGame();

canvas.addEventListener("mousemove", highlightGrid);
canvas.addEventListener("click", handleClick);

setInterval(gameLoop, 1000 / FRAME_RATE);

function gameLoop() {
    drawBackground();
    drawGridSquares();
    drawGridDots();
    drawScores();
    computerMove();
}

function handleClick(ev) {
    if (!isPlayerTurn || endTime > 0) {
        return;
    }
    chooseSide();
}

function drawBackground() {
    ctx.fillStyle = BG_COLOR;
    ctx.strokeStyle = BORDER_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeRect(LINE_WIDTH / 2, LINE_WIDTH / 2, CANVAS_WIDTH - LINE_WIDTH, CANVAS_HEIGHT - LINE_WIDTH);
}

function drawDot(x, y) {
    ctx.fillStyle = DOT_COLOR;
    ctx.beginPath();
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

function drawGridDots() {
    for (let i = 0; i < GRID_DIM + 1; i++) {
        for (let j = 0; j < GRID_DIM + 1; j++) {
            drawDot(getGridX(j), getGridY(i));
        }
    }
}

function drawLine(x0, y0, x1, y1, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawScores() {
    let compColor = isPlayerTurn ? COMP_HIGHLIGHT_COLOR : COMP_COLOR;
    let playerColor = isPlayerTurn ? PLAYER_COLOR : PLAYER_HIGHLIGHT_COLOR;
    drawText(PLAYER_TEXT, CANVAS_WIDTH * 0.25, TOP_MARGIN * 0.25, playerColor, TOP_TEXT_SIZE);
    drawText(playerScore, CANVAS_WIDTH * 0.25, TOP_MARGIN * 0.6, playerColor, TOP_TEXT_SIZE * 2);
    drawText(COMP_TEXT, CANVAS_WIDTH * 0.75, TOP_MARGIN * 0.25, compColor, TOP_TEXT_SIZE);
    drawText(compScore, CANVAS_WIDTH * 0.75, TOP_MARGIN * 0.6, compColor, TOP_TEXT_SIZE * 2);

    if (endTime > 0) {
        endTime--;

        if (compScore === playerScore) {
            drawText(TIE_TEXT, CANVAS_WIDTH * 0.5, TOP_MARGIN * 0.6, TIE_COLOR, TOP_TEXT_SIZE);
        } else {
            let playerWins = playerScore > compScore;
            let color = playerWins ? PLAYER_COLOR : COMP_COLOR;
            let text = playerWins ? PLAYER_TEXT : COMP_TEXT;
            drawText(text, CANVAS_WIDTH * 0.5, TOP_MARGIN * 0.5, color, TOP_TEXT_SIZE);
            drawText(WIN_TEXT, CANVAS_WIDTH * 0.5, TOP_MARGIN * 0.7, color, TOP_TEXT_SIZE);
        }

        if (endTime === 0) {
            startNewGame();
        }
    }
}

function drawGridSquares() {
    for (let row of gridSquares) {
        for (let square of row) {
            square.drawSides();
            square.drawFill();
        }
    }
}

function drawText(text, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.font = size + "px dejavu sans mono";
    ctx.fillText(text, x, y);
}

function getColor(player, light) {
    return player ? (light ? PLAYER_HIGHLIGHT_COLOR : PLAYER_COLOR) : (light ? COMP_HIGHLIGHT_COLOR : COMP_COLOR);
}

function getText(player, small) {
    return player ? (small ? PLAYER_TEXT_SMALL : PLAYER_TEXT) : (small ? COMP_TEXT_SMALL : COMP_TEXT);
}

function getGridX(col) {
    return CELL_SIZE * (col + 1);
}

function getGridY(row) {
    return TOP_MARGIN + CELL_SIZE * row;
}

function getValidNeighborSides(row, col) {
    let sides = [];
    let square = gridSquares[row][col];

    if (!square.sideLeft.selected) {
        if (col === 0 || gridSquares[row][col - 1].numSelected < 2) {
            sides.push(Side.LEFT);
        }
    }

    if (!square.sideRight.selected) {
        if (col === gridSquares[0].length - 1 || gridSquares[row][col + 1].numSelected < 2) {
            sides.push(Side.RIGHT);
        }
    }

    if (!square.sideTop.selected) {
        if (row === 0 || gridSquares[row - 1][col].numSelected < 2) {
            sides.push(Side.TOP);
        }
    }

    if (!square.sideBottom.selected) {
        if (row === gridSquares.length - 1 || gridSquares[row + 1][col].numSelected < 2) {
            sides.push(Side.BOTTOM);
        }
    }

    return sides;
}

function computerMove() {
    if (isPlayerTurn || endTime > 0) {
        return;
    }

    if (compTime > 0) {
        compTime--;
        if (compTime === 0) {
            chooseSide();
        }
        return;
    }

    let options = [[], [], []];

    for (let i = 0; i < gridSquares.length; i++) {
        for (let j = 0; j < gridSquares[0].length; j++) {
            switch (gridSquares[i][j].numSelected) {
                case 3:
                    options[0].push({square: gridSquares[i][j], sides: []});
                    break;
                case 0:
                case 1:
                    let sides = getValidNeighborSides(i, j);
                    let priority = sides.length > 0 ? 1 : 2;
                    options[priority].push({square: gridSquares[i][j], sides: sides});
                    break;
                case 2:
                    options[2].push({square: gridSquares[i][j], sides: []});
                    break;
            }
        }
    }

    let option;
    if (options[0].length > 0) {
        option = options[0][Math.floor(Math.random() * options[0].length)];
    } else if (options[1].length > 0) {
        option = options[1][Math.floor(Math.random() * options[1].length)];
    } else if (options[2].length > 0) {
        option = options[2][Math.floor(Math.random() * options[2].length)];
    }

    let side = null;
    if (option.sides.length > 0) {
        side = option.sides[Math.floor(Math.random() * option.sides.length)];
    }

    let coords = option.square.getFreeSideCoords(side);
    highlightSide(coords.x, coords.y);

    compTime = Math.ceil(COMP_DELAY * FRAME_RATE);
}

function highlightGrid(ev) {
    if (!isPlayerTurn || endTime > 0) {
        return;
    }

    let x = ev.clientX - canvasRect.left;
    let y = ev.clientY - canvasRect.top;

    highlightSide(x, y);
}

function highlightSide(x, y) {
    for (let row of gridSquares) {
        for (let square of row) {
            square.highlight = null;
        }
    }

    let rows = gridSquares.length;
    let cols = gridSquares[0].length;
    activeCells = [];
    OUTER: for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gridSquares[i][j].contains(x, y)) {
                let side = gridSquares[i][j].highlightSide(x, y);
                if (side != null) {
                    activeCells.push({row: i, col: j});
                }

                let row = i, col = j, highlight, neighbor = true;
                if (side === Side.LEFT && j > 0) {
                    col = j - 1;
                    highlight = Side.RIGHT;
                } else if (side === Side.RIGHT && j < cols - 1) {
                    col = j + 1;
                    highlight = Side.LEFT;
                } else if (side === Side.TOP && i > 0) {
                    row = i - 1;
                    highlight = Side.BOTTOM;
                } else if (side === Side.BOTTOM && i < rows - 1) {
                    row = i + 1;
                    highlight = Side.TOP;
                } else {
                    neighbor = false;
                }

                if (neighbor) {
                    gridSquares[row][col].highlight = highlight;
                    activeCells.push({row: row, col: col});
                }

                break OUTER;
            }
        }
    }
}

function startNewGame() {
    activeCells = [];
    isPlayerTurn = Math.random() >= 0.5;
    compScore = 0;
    playerScore = 0;
    endTime = 0;

    gridSquares = [];
    for (let i = 0; i < GRID_DIM; i++) {
        gridSquares[i] = [];
        for (let j = 0; j < GRID_DIM; j++) {
            gridSquares[i][j] = new Square(getGridX(j), getGridY(i), CELL_SIZE, CELL_SIZE);
        }
    }
}

function chooseSide() {
    if (activeCells == null || activeCells.length === 0) {
        return;
    }

    let filledSquare = false;
    for (let cell of activeCells) {
        if (gridSquares[cell.row][cell.col].selectSide()) {
            filledSquare = true;
        }
    }
    activeCells = [];

    if (filledSquare) {
        if (playerScore + compScore === GRID_DIM * GRID_DIM) {
            endTime = Math.ceil(GAME_DELAY * FRAME_RATE);
        }
    } else {
        isPlayerTurn = !isPlayerTurn;
    }
}

function Square(x, y, w, h) {
    this.w = w;
    this.h = h;
    this.bottom = y + h;
    this.left = x;
    this.right = x + w;
    this.top = y;
    this.highlight = null;
    this.numSelected = 0;
    this.owner = null;
    this.sideBottom = {owner: null, selected: false};
    this.sideLeft = {owner: null, selected: false};
    this.sideRight = {owner: null, selected: false};
    this.sideTop = {owner: null, selected: false};

    this.contains = function(x, y) {
        return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
    }

    this.drawFill = function() {
        if (this.owner == null) {
            return;
        }

        ctx.fillStyle = getColor(this.owner, true);
        ctx.fillRect(
            this.left + LINE_WIDTH, this.top + LINE_WIDTH,
            this.w - LINE_WIDTH * 2, this.h - LINE_WIDTH * 2
        );

        drawText(
            getText(this.owner, true),
            this.left + this.w / 2,
            this.top + this.h / 2,
            getColor(this.owner, false),
            CELL_TEXT_SIZE
        );
    }

    this.drawSide = function(side, color) {
        switch(side) {
            case Side.BOTTOM:
                drawLine(this.left, this.bottom, this.right, this.bottom, color);
                break;
            case Side.LEFT:
                drawLine(this.left, this.top, this.left, this.bottom, color);
                break;
            case Side.RIGHT:
                drawLine(this.right, this.top, this.right, this.bottom, color);
                break;
            case Side.TOP:
                drawLine(this.left, this.top, this.right, this.top, color);
                break;
        }
    }

    this.drawSides = function() {
        if (this.highlight != null) {
            this.drawSide(this.highlight, getColor(isPlayerTurn, true));
        }

        if (this.sideBottom.selected) {
            this.drawSide(Side.BOTTOM, getColor(this.sideBottom.owner, false));
        }
        if (this.sideLeft.selected) {
            this.drawSide(Side.LEFT, getColor(this.sideLeft.owner, false));
        }
        if (this.sideRight.selected) {
            this.drawSide(Side.RIGHT, getColor(this.sideRight.owner, false));
        }
        if (this.sideTop.selected) {
            this.drawSide(Side.TOP, getColor(this.sideTop.owner, false));
        }
    }
    
    this.getFreeSideCoords = function(side) {
        let coordsBottom = {x: this.left + this.w / 2, y: this.bottom - 1};
        let coordsLeft = {x: this.left, y: this.top + this.h / 2};
        let coordsRight = {x: this.right - 1, y: this.top + this.h / 2};
        let coordsTop = {x: this.left + this.w / 2, y: this.top};

        let coords = null;
        switch (side) {
            case Side.BOTTOM:
                coords = coordsBottom;
                break;
            case Side.LEFT:
                coords = coordsLeft;
                break;
            case Side.RIGHT:
                coords = coordsRight;
                break;
            case Side.TOP:
                coords = coordsTop;
                break;
        }

        if (coords != null) {
            return coords;
        }

        let freeCoords = [];
        if (!this.sideBottom.selected) {
            freeCoords.push(coordsBottom);
        }
        if (!this.sideLeft.selected) {
            freeCoords.push(coordsLeft);
        }
        if (!this.sideRight.selected) {
            freeCoords.push(coordsRight);
        }
        if (!this.sideTop.selected) {
            freeCoords.push(coordsTop);
        }
        return freeCoords[Math.floor(Math.random() * freeCoords.length)];
    }

    this.highlightSide = function(x, y) {
        let dBottom = this.bottom - y;
        let dLeft = x - this.left;
        let dRight = this.right - x;
        let dTop = y - this.top;

        let dClosest = Math.min(dBottom, dLeft, dRight, dTop);

        if (dClosest === dBottom && !this.sideBottom.selected) {
            this.highlight = Side.BOTTOM;
        } else if (dClosest === dLeft && !this.sideLeft.selected) {
            this.highlight = Side.LEFT;
        } else if (dClosest === dRight && !this.sideRight.selected) {
            this.highlight = Side.RIGHT;
        } else if (dClosest === dTop && !this.sideTop.selected) {
            this.highlight = Side.TOP;
        }

        return this.highlight;
    }

    this.selectSide = function() {
        if (this.highlight == null) {
            return;
        }

        switch (this.highlight) {
            case Side.BOTTOM:
                this.sideBottom.owner = isPlayerTurn;
                this.sideBottom.selected = true;
                break;
            case Side.LEFT:
                this.sideLeft.owner = isPlayerTurn;
                this.sideLeft.selected = true;
                break;
            case Side.RIGHT:
                this.sideRight.owner = isPlayerTurn;
                this.sideRight.selected = true;
                break;
            case Side.TOP:
                this.sideTop.owner = isPlayerTurn;
                this.sideTop.selected = true;
                break;
        }
        this.highlight = null;

        this.numSelected++;
        if (this.numSelected === 4) {
            this.owner = isPlayerTurn;

            if (isPlayerTurn) {
                playerScore++;
            } else {
                compScore++;
            }

            return true;
        }

        return false;
    }
}