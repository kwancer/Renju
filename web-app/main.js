import R from "./ramda.js";
import Renju from "./renju.js";
import createCountdown from "../node_modules/create-countdown/index.js";

let rows = 9;
let columns = 9;
let black;
let white;
let clock;
let paused = true;
let focusedRow;
let focusedColumn;
let prevTd;
let gameState;
const gameBoard = document.getElementById("game_board");

function displayMessage(message) {
    document.getElementById("message").textContent = message;
    document.getElementById("message_popup").style = "display: block";
    setTimeout(function () {
        document.getElementById("message_popup").style = "display: none";
    }, 3000);
}

function updateClock() {
    let player = Renju.colourToMove(gameState);
    if (Renju.movesMade(gameState) < 3) {
        player = "black";
    }
    if (player === "black" && clock.currentClock === "white") {
        clock.currentClock = "black";
        clock.black.start();
        clock.white.stop();
    } else if (player === "white" && clock.currentClock === "black") {
        clock.currentClock = "white";
        clock.white.start();
        clock.black.stop();
    }
}

function updateDisplay() {
    let colourToMove = Renju.colourToMove(gameState);
    if (Renju.movesMade(gameState) === 1) {
        displayMessage(
            "Initial three moves are played by " +
            black +
            " (tentative black)" +
            "!"
        );
    }
    if (Renju.movesMade(gameState) === 3) {
        document.getElementById("popup").style = "display: block";
        paused = true;
    }
    if (Renju.movesMade(gameState) === 4) {
        displayMessage(
            black +
            " (black) plays twice and white chooses which to keep!"
        );
    }
    if (Renju.movesMade(gameState) === 6) {
        displayMessage(
            white +
            " (white) needs to click on a move to remove it!"
        );
    }
    if (Renju.movesMade(gameState) <= 5) {
        document.getElementById("turn_display_white").textContent = "Opening";
        document.getElementById("turn_display_black").textContent = "Opening";
    } else if (colourToMove === "white") {
        document.getElementById("turn_display_white").textContent = "Your go!";
        document.getElementById("turn_display_black").textContent = "Waiting";
    } else if (colourToMove === "black") {
        document.getElementById("turn_display_white").textContent = "Waiting";
        document.getElementById("turn_display_black").textContent = "Your go!";
    }
    document.getElementById("black_display").textContent = " " + black;
    document.getElementById("white_display").textContent = " " + white;
}

function endGame(winner) {
    document.getElementsByClassName("game_board_container")[0].style.display = (
        "none"
    );
    document.getElementById("turn_display_white").textContent = "Game Over";
    document.getElementById("turn_display_black").textContent = "Game Over";
    document.getElementById("end_game_container").style = "display: flex";
    document.getElementById("end_game_message").textContent = (
        winner + " wins" + " after " +
        Renju.movesMade(gameState) + " moves!"
    );
    document.getElementById("end_game_overview").textContent = (
        Renju.formattedMoves(gameState)
    );
    if (clock !== undefined) {
        clock.black.stop();
        clock.white.stop();
    }
    document.getElementById("winning_buttons_black").style = "display: none";
    document.getElementById("winning_buttons_white").style = "display: none";
}

function checkWin(playerColour) {
    let checkedWin = Renju.checkWin(playerColour, gameState);
    if (checkedWin.valid) {
        displayMessage(playerColour + " wins! " + checkedWin.reason);
        endGame(playerColour);
    } else {
        displayMessage(checkedWin.reason);
    }
}

function timeOut(playerColour) {
    displayMessage(playerColour + " timed out!");
    if (playerColour === "black") {
        endGame("white");
    } else {
        endGame("black");
    }
}

function pass(playerColour) {
    let attemptedPass = Renju.attemptPass(playerColour, gameState);
    if (attemptedPass.valid) {
        gameState = attemptedPass.gameState;
        displayMessage(playerColour + " passes!");
        updateDisplay();
        if (Renju.checkDraw(gameState).valid) {
            endGame("Noone");
        }
    } else {
        displayMessage("You can't pass now!");
    }
}

function initiateClock(clockSetting) {
    clock = {
        black: createCountdown({
            h: 0,
            m: Number(clockSetting),
            s: 0
        }, {
            listen: function ({mm, ss}) {
                updateClock();
                document.getElementById("clock_black").textContent = (
                    `${mm}:${ss}`
                );
            },
            done: function () {
                timeOut("black");
            }
        }),
        white: createCountdown({
            h: 0,
            m: Number(clockSetting),
            s: 0
        }, {
            listen: function ({mm, ss}) {
                updateClock();
                document.getElementById("clock_white").textContent = (
                    `${mm}:${ss}`
                );
            },
            done: function () {
                timeOut("white");
            }
        }),
        currentClock: "black"
    };
    clock.black.start();
    document.getElementById("clock_white").textContent = `${clockSetting}:00`;
    document.getElementById("clock_container_right").style = "display: block";
    document.getElementById("clock_container_left").style = "display: block";
}

function generateBoard(gameRows, gameColumns) {
    gameState = Renju.initiateGame(gameRows, gameColumns, null);
    R.range(0, gameRows * 2 + 1).forEach(function (row_index) {
        const tr = document.createElement("tr");
        R.range(0, gameColumns * 2 + 1).forEach(function (column_index) {
            const td = document.createElement("td");
            let row = (row_index - 1) / 2;
            let column = (column_index - 1) / 2;
            if (Number.isInteger(row) && Number.isInteger(column)) {
                td.onclick = function () {
                    if (paused) {
                        return;
                    }
                    let player = Renju.colourToMove(gameState);
                    let attemptedPly = Renju.attemptPly(
                        player,
                        row,
                        column,
                        gameState
                    );
                    if (attemptedPly.valid) {
                        gameState = attemptedPly.gameState;
                        td.style.backgroundColor = player;
                        td.style.cursor = "";
                        td.style.scale = "1.8";
                        td.style.boxShadow = (
                            "1px 1px 1px 1px " + "rgba(0, 0, 0, 0.3)"
                        );
                    } else {
                        let attemptedRemove = Renju.attemptRemove(
                            row,
                            column,
                            gameState
                        );
                        if (attemptedRemove.valid) {
                            gameState = attemptedRemove.gameState;
                            td.style.backgroundColor = "";
                            td.style.cursor = "";
                            td.style.scale = "1.5";
                            td.style.boxShadow = "";
                        }
                    }
                    updateDisplay();
                };
                td.onmouseover = function () {
                    if (
                        Renju.isMoveValid(
                            Renju.colourToMove(gameState),
                            row,
                            column,
                            gameState
                        ) && !paused
                    ) {
                        td.style.backgroundColor = Renju.colourToMove(
                            gameState
                        );
                        td.style.cursor = "pointer";
                        td.style.scale = "1.9";
                        td.style.boxShadow = (
                            "2px 2px 2px 2px " + "rgba(0, 0, 0, 0.3)"
                        );
                    }
                };
                td.onmouseout = function () {
                    if (td.style.cursor === "pointer") {
                        td.style.backgroundColor = "";
                        td.style.cursor = "";
                        td.style.scale = "1.5";
                        td.style.boxShadow = "";
                    }
                };
                td.onfocusout = function () {
                    td.onmouseout();
                };
                td.style.borderRadius = "50%";
                td.style.scale = "1.5";
                td.classList.add("active_cell");
                td.tabIndex = 0;
            } else if (Number.isInteger(row) || Number.isInteger(column)) {
                td.classList.add("active_cell");
            } else {
                td.classList.add("inactive_cell");
            }
            tr.append(td);
        });
        gameBoard.append(tr);
    });
    document.documentElement.style.setProperty(
        "--game-rows",
        gameRows * 2 + 1
    );
    document.documentElement.style.setProperty(
        "--game-columns",
        gameColumns * 2 + 1
    );
    focusedRow = gameRows;
    focusedColumn = gameColumns - 2;
    rows = gameRows;
    columns = gameColumns;
}

document.getElementById("start_game").onclick = function () {
    let gameSize = Number(document.getElementById("game_type").value);
    generateBoard(gameSize, gameSize);
    paused = false;
    document.getElementsByClassName("game_info_container")[0].style.display = (
        "none"
    );
    document.getElementsByClassName("game_board_container")[0].style.display = (
        "block"
    );
    document.getElementById("right").style.opacity = 1;
    document.getElementById("left").style.opacity = 1;
    white = document.getElementById("player2").value;
    black = document.getElementById("player1").value;
    let clockSetting = document.getElementById("timer").value;
    if (clockSetting !== "off") {
        initiateClock(clockSetting);
    }
    updateDisplay();
    displayMessage("First move must be in the middle!");
};

document.getElementById("no").onclick = function () {
    document.getElementById("popup").style = "display: none";
    paused = false;
    displayMessage("Colours remain the same, " + white + " to move!");
};

document.getElementById("yes").onclick = function () {
    let temp = black;
    black = white;
    white = temp;
    updateDisplay();
    if (clock !== undefined) {
        clock.black.stop();
        clock.white.stop();
        let tempWhite = document.getElementById("clock_white").textContent;
        let tempBlack = document.getElementById("clock_black").textContent;
        clock.white.set(
            {
                m: Number(tempBlack.slice(0, 2)),
                s: Number(tempBlack.slice(3, 5)) + 3
            }
        );
        clock.black.set(
            {
                m: Number(tempWhite.slice(0, 2)),
                s: Number(tempWhite.slice(3, 5))
            }
        );
        clock.white.start();
        document.getElementById("clock_black").textContent = tempWhite;
    }
    document.getElementById("popup").style = "display: none";
    displayMessage("Colours have been swapped! " + white + " to play!");
    paused = false;
};

document.getElementById("win_white").onclick = function () {
    checkWin("white");
};

document.getElementById("win_black").onclick = function () {
    checkWin("black");
};

document.getElementById("pass_white").onclick = function () {
    pass("white");
};

document.getElementById("pass_black").onclick = function () {
    pass("black");
};

document.getElementById("play_again").onclick = function () {
    location.reload();
};

window.addEventListener("keydown", function (e) {
    if (!paused) {
        const td = document.querySelector(
            `tr:nth-child(${focusedRow + 1}) td:nth-child(${focusedColumn + 1})`
        );
        switch (e.key) {
        case "ArrowUp":
            if (focusedRow > 0) {
                focusedRow -= 2;
            }
            break;
        case "ArrowDown":
            if (focusedRow < rows * 2) {
                focusedRow += 2;
            }
            break;
        case "ArrowLeft":
            if (focusedColumn > 0) {
                focusedColumn -= 2;
            }
            break;
        case "ArrowRight":
            if (focusedColumn < columns * 2) {
                focusedColumn += 2;
            }
            break;
        case "Enter":
            td.click();
            break;
        }
        const newTd = document.querySelector(
            `tr:nth-child(${focusedRow + 1}) td:nth-child(${focusedColumn + 1})`
        );
        if (prevTd && prevTd !== newTd) {
            prevTd.onmouseout();
        }
        newTd.focus();
        newTd.onmouseover();
        prevTd = newTd;
    }
});

