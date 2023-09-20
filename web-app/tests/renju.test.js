import Renju from "../renju.js";
import R from "../ramda.js";

/**
 * renju.test.js is a test suite for the Renju game.
 * @namespace Renju.test
 * @author Krzysztof Wancerski
 * @version 1.0
 */

/**
 * Returns a string representation of the board.
 * @memberof Renju.test
 * @function
 * @param {Renju.playerColour[][]} board The board to display.
 * @returns {string} The string representation of the board.
*/
const displayBoard = function (board) {
    let table = board.map((row) => row.join(" | ")).join("\n");
    return table;
};

/**
 * Returns if the board is in a valid state.
 * A board is valid if all the following are true:
 * - The board is a 2d array.
 * - The board is a rectangular 2d array containing only
 * null, "black", "white" or "removed".
 * - At most one player has a winning configuration.
 * - The moves are in order.
 * - The center of the board has a black token if there are any moves.
 * @memberof Renju.test
 * @function
 * @param {gameState} gameState The gameState to test.
 * @throws If the board fails any of the above conditions.
 */
const throwIfInvalid = function (gameState) {
    let board = gameState.board;
    let moves = gameState.moves;
    if (!Array.isArray(board) || !Array.isArray(board[0])) {
        throw new Error(
            "The board is not a 2D array: " + displayBoard(board)
        );
    }
    const height = board[0].length;
    const width = board.length;
    //check if both are odd
    if (height % 2 === 0 || width % 2 === 0) {
        throw new Error(
            "The board does not have a distinct centre: " + displayBoard(board)
        );
    }
    // Only valid tokens
    const token_or_empty = ["white", "black", "removed", null];
    const contains_valid_tokens = R.pipe(
        R.flatten,
        R.all((slot) => token_or_empty.includes(slot))
    )(board);
    if (!contains_valid_tokens) {
        throw new Error(
            "The board contains invalid tokens: " + displayBoard(board)
        );
    }
    // Moves are black then white then black etc. in the order they were made.
    const moves_are_in_order = R.pipe(
        R.map((move) => move.playerColour),
        R.slice(6, moves.length),
        R.aperture(2),
        R.all(function ([player1, player2]) {
            return player1 !== player2;
        })
    )(moves);
    if (!moves_are_in_order && moves.length > 1) {
        throw new Error(
            "The moves are not in order: " + JSON.stringify(moves)
        );
    }
    if (Renju.movesMade(gameState) > 0) {
    // The center of the board has a black token
        if (board[Math.floor(width / 2)][Math.floor(height / 2)] !== "black") {
            throw new Error(
                "The center of the board does not have a black token: " +
                displayBoard(board)
            );
        }
    }
};

describe("Empty Game State", function () {
    it("An empty board is a valid board", function () {
        const emptyGameState = Renju.initiateGame();
        throwIfInvalid(emptyGameState);
    });

    it("An empty board is not winning for either colour.", function () {
        const gameState = Renju.initiateGame();
        if (Renju.checkWin("black", gameState).valid) {
            throw new Error(
                "An empty board should not be winning: " +
                displayBoard(gameState.board) +
                " for black"
            );
        }
        if (Renju.checkWin("white", gameState).valid) {
            throw new Error(
                "An empty board should not be winning: " +
                displayBoard(gameState.board) +
                " for white"
            );
        }
    });

    it("An empty board has all free columns.", function () {
        const emptyBoard = Renju.initiateGame().board;
        const all_free_slots = R.pipe(
            R.flatten,
            R.all(R.equals(null))
        )(emptyBoard);
        if (!all_free_slots) {
            throw new Error(
                "The empty board has filled slots: " +
                displayBoard(emptyBoard)
            );
        }
    });

    it("An empty board has black to move", function () {
        const gameState = Renju.initiateGame();
        if (
            Renju.colourToMove(gameState) !== "black"
        ) {
            throw new Error(
                "The empty board should have black to move" +
                displayBoard(gameState.board)
            );
        }
    });
    it("An empty board should not be a draw", function () {
        const gameState = Renju.initiateGame();
        if (Renju.checkDraw(gameState).valid) {
            throw new Error(
                "The empty board should not be a draw" +
                displayBoard(gameState.board)
            );
        }
    });

    it("An empty moves queue should have no moves", function () {
        const gameState = Renju.initiateGame();
        if (gameState.moves.length !== 0) {
            throw new Error(
                "The empty board should have no moves" +
                gameState.moves
            );
        }
    });
});

/**
 * Checks if the player can move in the given rows and columns
 *  and compares it to the valid parameter.
    * @memberof Renju.test
    * @function
    * @param {Renju.playerColour} playerColour The colour of the player
    * to check.
    * @param {number[]} rows The rows to check.
    * @param {number[]} cols The columns to check.
    * @param {boolean} valid If the player should be able to move.
    * @param {Renju.gameState} gameState The gameState to check.
    * @throws If the player cannot move but should be able to or vice versa.
 */
function checkMoves(playerColour, rows, cols, valid, gameState) {
    R.range(0, rows.length).forEach(function (ignore, rowIndex) {
        R.range(0, cols.length).forEach(function (ignore, columnIndex) {
            if (
                Renju.attemptPly(
                    playerColour,
                    rows[rowIndex],
                    cols[columnIndex],
                    gameState
                ).valid !== valid
            ) {
                throw new Error(
                    "Given the board " +
                    displayBoard(gameState.board) +
                    " the move " +
                    rows[rowIndex] + "," + cols[columnIndex] + " by " +
                    playerColour +
                    " Then the move should be valid? " +
                    valid
                );
            }
        });
    });
}

/**
    * Generates a random game state with the given number of moves.
    * @memberof Renju.test
    * @function
    * @param {number} numberOfMoves The number of moves to generate.
    * @param {boolean} diagonalOpening If the opening should be diagonal.
    * @param {Renju.gameState} gameState The gameState to start from.
    * @returns {Renju.gameState} The generated game state.
 */
function generateMoves(numberOfMoves, diagonalOpening, gameState) {
    gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
    if (diagonalOpening) {
        gameState = Renju.attemptPly("white", 6, 8, gameState).gameState;
    } else {
        gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
    }
    R.range(0, numberOfMoves - 2).forEach(function () {
        let row = Math.floor(Math.random() * 14);
        let col = Math.floor(Math.random() * 14);
        let playerColour = Renju.colourToMove(gameState);
        while (
            !Renju.isMoveValid(playerColour, row, col, gameState)
        ) {
            row = Math.floor(Math.random() * 14);
            col = Math.floor(Math.random() * 14);
        }
        if (Renju.attemptPly(playerColour, row, col, gameState).valid) {
            gameState = Renju.attemptPly(
                playerColour,
                row,
                col,
                gameState
            ).gameState;
        }
        if (Renju.attemptRemove(row, col, gameState).valid) {
            gameState = Renju.attemptRemove(row, col, gameState).gameState;
        }
    });
    return gameState;
}

/**
 * Generates an opening game state.
 * @memberof Renju.test
 * @function
 * @returns {Renju.gameState} The generated game state.
*/
function simulateOpening() {
    let gameState = Renju.initiateGame();
    gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
    gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
    gameState = Renju.attemptPly("black", 7, 8, gameState).gameState;
    gameState = Renju.attemptPly("white", 6, 8, gameState).gameState;
    gameState = Renju.attemptPly("black", 7, 9, gameState).gameState;
    gameState = Renju.attemptPly("black", 6, 9, gameState).gameState;
    gameState = Renju.attemptRemove(7, 9, gameState).gameState;
    gameState = Renju.attemptPly("white", 7, 6, gameState).gameState;
    return gameState;
}

describe("Opening plies", function () {
    it("The first move must be black and in the middle", function () {
        const gameState = Renju.initiateGame();
        const rows = R.filter((n) => n !== 7, R.range(0, 14));
        const cols = R.filter((n) => n !== 7, R.range(0, 14));
        //invalid moves
        checkMoves("black", rows, cols, false, gameState);
        checkMoves("white", rows, rows, false, gameState);
        checkMoves("white", [7], [7], false, gameState);
        //valid moves
        checkMoves("black", [7], [7], true, gameState);
    });

    it("The second move must be white and next to the middle", function () {
        let gameState = Renju.initiateGame();
        gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
        const validRows = [6, 7, 8];
        const validCols = [6, 8];
        const cols = R.concat(R.range(0, 6), R.range(9, 14));
        const rows = R.concat(R.range(0, 6), R.range(9, 14));
        //invalid moves
        checkMoves("white", rows, cols, false, gameState);
        checkMoves("black", rows, cols, false, gameState);
        checkMoves("black", validRows, validCols, false, gameState);
        checkMoves("white", [7], [7], false, gameState);
        //valid moves
        checkMoves("white", validRows, validCols, true, gameState);
        checkMoves("white", validCols, validRows, true, gameState);
    });

    it(
        "The third move must be black and " +
        "played according to the vertical opening pattern",
        function () {
            let gameState = Renju.initiateGame();
            //pattern 1
            gameState = generateMoves(2, false, gameState);
            let cols = R.concat(R.range(0, 5), R.range(10, 14));
            let rows = R.concat(R.range(0, 5), R.range(10, 14));
            //invalid moves
            checkMoves("black", rows, cols, false, gameState);
            checkMoves(
                "white",
                R.range(0, 14),
                R.range(0, 14),
                false,
                gameState
            );
            //valid moves
            checkMoves("black", R.range(5, 9), [9], true, gameState);
            checkMoves("black", R.range(5, 9), [8], true, gameState);
            checkMoves("black", [5, 8, 9], [7], true, gameState);
            //pattern 2
        }
    );

    it(
        "The third move must be black and played according" +
        " to the diagonal opening pattern",
        function () {
            let gameState = Renju.initiateGame();
            gameState = generateMoves(2, true, gameState);
            let rows = R.concat(R.range(0, 7), R.range(10, 14));
            let cols = R.concat(R.range(0, 5), R.range(10, 14));
            //invalid moves
            checkMoves("black", rows, cols, false, gameState);
            checkMoves(
                "white",
                R.range(0, 14),
                R.range(0, 14),
                false,
                gameState
            );
            //valid moves
            checkMoves("black", [5, 6, 7, 8, 9], [9], true, gameState);
            checkMoves("black", [7, 8, 9], [8], true, gameState);
            checkMoves("black", [8, 9], [7], true, gameState);
            checkMoves("black", [8, 9], [6], true, gameState);
            checkMoves("black", [9], [5], true, gameState);
        }
    );

    it("The fourth move must be white", function () {
        let gameState = Renju.initiateGame();
        gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
        gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
        gameState = Renju.attemptPly("black", 8, 7, gameState).gameState;
        const cols = R.concat(R.range(0, 7), R.range(8, 14));
        const rows = R.range(0, 14);
        checkMoves("white", rows, cols, true, gameState);
        checkMoves("black", rows, cols, false, gameState);
    });

    it("The fifth move must be black", function () {
        let gameState = Renju.initiateGame();
        gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
        gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
        gameState = Renju.attemptPly("black", 8, 7, gameState).gameState;
        gameState = Renju.attemptPly("white", 3, 7, gameState).gameState;
        const cols = R.concat(R.range(0, 6), R.range(8, 14));
        const rows = R.range(0, 14);
        checkMoves("black", rows, cols, true, gameState);
        checkMoves("white", rows, cols, false, gameState);
    });

    it("The sixth move must be black", function () {
        let gameState = Renju.initiateGame();
        gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
        gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
        gameState = Renju.attemptPly("black", 8, 7, gameState).gameState;
        gameState = Renju.attemptPly("white", 3, 7, gameState).gameState;
        gameState = Renju.attemptPly("black", 9, 7, gameState).gameState;
        const cols = R.concat(R.range(0, 6), R.range(8, 14));
        const rows = R.range(0, 14);
        checkMoves("black", rows, cols, true, gameState);
        checkMoves("white", rows, cols, false, gameState);
    });

    it(
        "The seventh move must be white and must not be made until " +
        "one of the black stones has been removed.",
        function () {
            let gameState = Renju.initiateGame();
            gameState = Renju.attemptPly("black", 7, 7, gameState).gameState;
            gameState = Renju.attemptPly("white", 6, 7, gameState).gameState;
            gameState = Renju.attemptPly("black", 8, 7, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 7, gameState).gameState;
            gameState = Renju.attemptPly("black", 9, 7, gameState).gameState;
            gameState = Renju.attemptPly("black", 5, 7, gameState).gameState;
            const cols = R.concat(R.range(0, 6), R.range(8, 14));
            const rows = R.concat(R.range(0, 6), R.range(8, 14));
            checkMoves("white", rows, cols, false, gameState);
            checkMoves("black", rows, cols, false, gameState);
            gameState = Renju.attemptRemove(5, 7, gameState).gameState;
            checkMoves("white", rows, cols, true, gameState);
            checkMoves("black", rows, cols, false, gameState);
            const isValidOpening = R.pipe(
                R.map((move) => move.playerColour),
                R.slice(0, 6),
                R.equals(["black", "white", "black", "white", "black", "black"])
            )(gameState.moves);
            if (!isValidOpening) {
                throw new Error(
                    "The opening moves are not valid: " +
                    JSON.stringify(gameState.moves)
                );
            }
        }
    );
});

describe("Further plies", function () {
    it("The board must be valid after 25 further moves", function () {
        let gameState = Renju.initiateGame();
        gameState = generateMoves(25, false, gameState);
        throwIfInvalid(gameState);
    });
    it("The board must be valid after 100 further moves", function () {
        let gameState = Renju.initiateGame();
        gameState = generateMoves(100, false, gameState);
        throwIfInvalid(gameState);
    });
});

describe("Winning games", function () {
    it(
        "Given a board with 5 in a row for black, when checking if black" +
        " has won, then the resulting object's valid property must be true " +
        "and reason must be 5 in a row for black.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 4, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 5, 3, gameState).gameState;
            if (!Renju.checkWin("black", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "5 in a row for black."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("black", gameState))
                );
            }
        }
    );
    it(
        "Given a board with 5 in a row for white, when checking if white " +
        "has won then the resulting object's valid property must be true and " +
        "reason must be 5 or more in a row for white.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 1, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 2, gameState).gameState;
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 3, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 4, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 5, gameState).gameState;
            if (!Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "5 in a row for white."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );
    it(
        "Given a board with more than 5 in a row for black, when checking " +
        "if white has won then the resulting object's valid property must be " +
        "true and reason: Black makes overline.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 4, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 5, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 5, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 6, 3, gameState).gameState;
            if (!Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "Black makes overline."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );
    it(
        "Given a board with a double three for black that was just made, " +
        "when checking if white has won then the resulting object's valid " +
        "property must be true and reason: Black makes double three.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 5, gameState).gameState;
            if (!Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "Black makes double three."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );

    it(
        "Given a board with a double four for black that was just made, " +
        "when checking if white has won then the resulting object's valid " +
        "property must be true and reason: Black makes double four.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 4, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 10, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 7, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 5, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 6, gameState).gameState;
            if (!Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "Black makes double four."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );
    it(
        "Given a board with a double three for black that was made earlier, " +
        "when checking if white has won then the resulting object's valid " +
        " property must be false and reason: No winning moves for white.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 5, gameState).gameState;
            gameState = Renju.attemptPly("white", 10, 7, gameState).gameState;
            if (Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: false,
                        reason: "No winning moves for white."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );

    it(
        "Given a board with a double four for black that was made earlier, " +
        "when checking if white has won then the resulting object's valid" +
        " property must be false and reason: No winning moves for white.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPly("black", 1, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 0, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 3, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 3, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 4, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 4, 3, gameState).gameState;
            gameState = Renju.attemptPly("white", 10, 6, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 4, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 7, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 5, gameState).gameState;
            gameState = Renju.attemptPly("white", 2, 8, gameState).gameState;
            gameState = Renju.attemptPly("black", 2, 6, gameState).gameState;
            gameState = Renju.attemptPly("white", 10, 9, gameState).gameState;
            if (Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: false,
                        reason: "No winning moves for white."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );

    it(
        "Given a board with no winning moves for anyone, " +
        "when checking if white has won then the resulting object's valid" +
        " property must be false and reason: No winning moves for white.",
        function () {
            let gameState = simulateOpening();
            if (Renju.checkWin("white", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: false,
                        reason: "No winning moves for white."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("white", gameState))
                );
            }
        }
    );
    it(
        "Given a board with no winning moves for anyone, " +
        "when checking if black has won then the resulting object's valid " +
        "property must be false and reason: No winning moves for black.",
        function () {
            let gameState = simulateOpening();
            if (Renju.checkWin("black", gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: false,
                        reason: "No winning moves for black."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkWin("black", gameState))
                );
            }
        }
    );
});

describe("Drawing games", function () {
    it(
        "Given a full board, " +
        "when checking for a draw then the resulting object must " +
        "have the valid property set to true and reason: The board is full.",
        function () {
            let gameState = simulateOpening();
            // Fill the board with moves
            R.range(0, 15).forEach(function (i) {
                R.range(0, 15).forEach(function (j) {
                    if (i % 2 === 0) {
                        gameState.board[i][j] = "black";
                    } else {
                        gameState.board[i][j] = "white";
                    }
                });
            });
            if (!Renju.checkDraw(gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "The board is full."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkDraw(gameState))
                );
            }
        }
    );
    it(
        "Given a board with no winning moves for anyone, " +
        "when checking for a draw then the resulting object must " +
        "have the valid property set to true and reason: No winning moves.",
        function () {
            let gameState = simulateOpening();
            if (Renju.checkDraw(gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: false
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkDraw(gameState))
                );
            }
        }
    );
    it(
        "Given a board with two passes in a row, " +
        "when checking for a draw then the resulting object must " +
        "have the valid property set to true and reason:" +
        "The last two moves were passes.",
        function () {
            let gameState = simulateOpening();
            gameState = Renju.attemptPass("black", gameState).gameState;
            gameState = Renju.attemptPass("white", gameState).gameState;
            if (!Renju.checkDraw(gameState).valid) {
                throw new Error(
                    "Given the board: " +
                    displayBoard(gameState.board) +
                    "the result should be " + JSON.stringify({
                        valid: true,
                        reason: "The last two moves were passes."
                    }) +
                    " but was " +
                    JSON.stringify(Renju.checkDraw(gameState))
                );
            }
        }
    );
});




