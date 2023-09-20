import R from "./ramda.js";

//API MODULES

/**
 * renju.js is a module to model and play "Renju". See the rules at
 * https://www.renju.net/rifrules/ .
 * @namespace Renju
 * @author Krzysztof Wancerski
 * @version 1.0
 */
const Renju = Object.create(null);

/**
 * A Board is a grid that stones can be placed into one at a time.
 * It is represented as a two dimensional array of values.
 * The dimensions of the board must be odd.
 * @memberof Renju
 * @typedef {Object} gameState
 * @property {Renju.playerColour[][]} board The board of the game.
 * @property {Renju.move[]} moves The moves made in the game.
 */

/**
 * The four values that can be in a cell of a board.
 * @memberof Renju
 * @typedef {string} playerColour
 * @property {string} "black" A black stone.
 * @property {string} "white" A white stone.
 * @property {string} "removed" A removed stone.
 * @property {null} null An empty cell.
*/

/**
 * The result of an attempt to make a move.
 * @memberof Renju
 * @typedef {Object} attemptedMove
 * @property {Renju.gameState} gameState The new gameState if move was valid.
 * @property {boolean} valid Whether the attempt to move was valid.
*/

/**
* The result of a check of ending conditions (win or draw).
* It is valid if the game has ended and provides the reason for the end.
* @memberof Renju
* @typedef {Object} checkedEndingConditions
* @property {boolean} valid Whether the game has ended.
* @property {string} reason The reason for the win or draw.
 */

/**
* A queue of moves made in the game.
* Keeps track of the moves made and the number of moves made.
* @memberof Renju
* @typedef {Object} move
* @property {Renju.playerColour} playerColour The colour which moved.
* @property {number} row The row of the move. -1 means pass.
* @property {number} column The column of the move. -1 means pass.
* @property {boolean} removed Whether the move was a removal.
 */

/**
 * Create a new game state with a board and a queue of moves.
 * Optionally with a specified width and height and value of each cell,
 * otherwise returns a standard 15 wide, 15 high board with values of null.
 * @memberof Renju
 * @function
 * @param {number} [width = 15] The width of the new board.
 * @param {number} [height = 15] The height of the new board.
 * @param {number} [input = null] The initial value of each cell.
 * @returns {Renju.gameState} The state of a game for starting a game.
 */
Renju.initiateGame = function (width = 15, height = 15, input = null) {
    return {
        board: createBoard(width, height, input),
        moves: []
    };
};

/**
 * Get the number of moves already made from the full game state.
 * @memberof Renju
 * @function
 * @param {Renju.gameState} gameState The game state to use.
 * @returns {number} The number of moves made.
 */
Renju.movesMade = function (gameState) {
    return gameState.moves.length;
};

/**
 * Get the next move number.
 * @memberof Renju
 * @function
 * @param {Renju.gameState} gameState The game state to use.
 * @returns {number} The next move number.
 */
Renju.nextMoveNumber = function (gameState) {
    return Renju.movesMade(gameState) + 1;
};

/**
* Check if a given move is valid according to the rules of Renju.
* This function is to stop the user from making invalid moves
* in the opening and to prevent the wrong colour from moving.
* It will evaluate to true if making illegal moves such as
* double threes, double fours or overlines. These can be made
* but the opponent can claim victory if they are made.
* @memberof Renju
* @function
* @param {Renju.playerColour} playerColour The colour to check.
* @param {number} row The row of the move.
* @param {number} column The column of the move.
* @param {Renju.gameState} gameState The game state to use.
* @returns {boolean} Whether the move is valid as described above.
*/
Renju.isMoveValid = function (playerColour, row, column, gameState) {
    let board = gameState.board;
    if (board[row][column] !== null && board[row][column] !== "removed") {
        return false;
    }
    const nextMoveNumber = Renju.nextMoveNumber(gameState);
    const columnMiddle = half(getBoardColumnNumber(board));
    const rowMiddle = half(getBoardRowNumber(board));
    switch (nextMoveNumber) {
    case 1:
        return (
            column === columnMiddle &&
            row === rowMiddle &&
            playerColour === "black"
        );
    case 2:
        return (
            isNextTo(
                rowMiddle,
                columnMiddle,
                row,
                column
            )
            && playerColour === "white"
        );
    case 3:
        return checkMoveThree(playerColour, row, column, board);
    case 4:
        return playerColour === "white";
    case 5:
        return playerColour === "black";
    case 6:
        return playerColour === "black";
    case 7:
        return checkMoveSeven(playerColour, row, column, board);
    default:
        return checkNormalMove(playerColour, gameState);
    }
};

/**
 * Returns the colour of the player who should make the next move.
 * @memberof Renju
 * @function
 * @param {Renju.gameState} gameState The game state to use.
 * @returns {Renju.playerColour} The colour of the player for the next move.
*/
Renju.colourToMove = function (gameState) {
    const movesMade = Renju.movesMade(gameState);
    if (movesMade <= 4 || movesMade >= 7) {
        if (movesMade % 2 === 0) {
            return "black";
        }
        return "white";
    }
    if (movesMade % 2 === 0) {
        return "white";
    }
    return "black";
};

/**
 * Checks if the game is winning for a given player. It does so by checking
 * if there are any winning moves made by the player or any illegal moves
 * made by the opponent. This is done in accordance with the rules of Renju.
 * @memberof Renju
 * @function
 * @param {Renju.playerColour} playerColour The colour of the player to check.
 * @param {Renju.gameState} gameState The game state to check.
 * @returns {Renju.checkedEndingConditions} The outcome of the check.
*/
Renju.checkWin = function (playerColour, gameState) {
    let board = gameState.board;
    if (playerColour === "black") {
        if (checkIfFiveInARow("black", board)) {
            return {
                valid: true,
                reason: "5 in a row for black."
            };
        }
    }
    if (playerColour === "white") {
        if (
            checkIfFiveInARow("white", board) ||
            checkOverline("white", board)
        ) {
            return {
                valid: true,
                reason: "5 or more in a row for white."
            };
        }
        if (checkOverline("black", board)) {
            return {
                valid: true,
                reason: "Black makes overline."
            };
        }
        if (
            blackMakesDoubleFour(board) &&
            !blackMakesDoubleFour(removeLastMove(gameState).board)
        ) {
            return {
                valid: true,
                reason: "Black makes double four."
            };
        }
        if (
            blackMakesDoubleThree(board) &&
            !blackMakesDoubleThree(removeLastMove(gameState).board)
        ) {
            return {
                valid: true,
                reason: "Black makes double three."
            };
        }
    }
    return {
        valid: false,
        reason: "No winning moves for " + playerColour + "."
    };
};

/**
 * Attempts to make a move according to the rules of Renju.
 * If the move is valid, it is made and the outcome is returned.
 * If the move is invalid, the outcome is returned.
 * This function checks the validity of the move using the
 * {@link Renju.isMoveValid} function.
 * @memberof Renju
 * @function
 * @param {Renju.playerColour} playerColour The colour of the player
 * who wishes to ply.
 * @param {number} row The row of the move.
 * @param {number} column The column of the move.
 * @param {Renju.gameState} gameState The game state to apply the ply.
 * @returns {Renju.attemptedMove} The outcome of the attempt.
*/
Renju.attemptPly = function (playerColour, row, column, gameState) {
    if (Renju.isMoveValid(playerColour, row, column, gameState)) {
        let board = R.clone(gameState.board);
        let moves = R.clone(gameState.moves);
        moves.push({
            row: row,
            column: column,
            playerColour: playerColour,
            removed: false
        });
        board[row][column] = playerColour;
        return {gameState: {
            board: board,
            moves: moves
        }, valid: true};
    }
    return {valid: false};
};

/**
 * Checks if the game is a draw. It does so by checking if the board is full
 * or if the last two moves were passes.
 * This is done in accordance with the rules of Renju.
 * @memberof Renju
 * @function
 * @param {Renju.gameState} gameState The game state to check.
 * @returns {Renju.checkedEndingConditions} The outcome of the check.
*/
Renju.checkDraw = function (gameState) {
    if (Renju.movesMade(gameState) < 3) {
        return {
            valid: false,
            reason: "The game has not progressed far enough."
        };
    }
    if (
        isBoardFull(gameState.board)
    ) {
        return {
            valid: true,
            reason: "The board is full."
        };
    }
    if (
        gameState.moves[gameState.moves.length - 1].row === -1 &&
        gameState.moves[gameState.moves.length - 2].row === -1
    ) {
        return {
            valid: true,
            reason: "The last two moves were passes."
        };
    }
    return {valid: false};
};

/**
 * Attempts to remove a piece according to the rules of Renju.
 * If the removal is valid, it is made and the outcome is returned.
 * If the removal is invalid, the outcome is returned.
 * The removal of a piece is only allowed in the fifth move of the game.
 * This is when black plays two stones in a row and white chooses which to
 * remove, as per the rules of Renju.
 * @memberof Renju
 * @function
 * @param {number} row The row of the piece to remove.
 * @param {number} column The column of the piece to remove.
 * @param {Renju.gameState} gameState The game state to remove the piece from.
 * @returns {Renju.attemptedMove} The outcome of the attempt.
*/
Renju.attemptRemove = function (row, column, gameState) {
    let board = R.clone(gameState.board);
    let moves = R.clone(gameState.moves);
    let previousMove = moves[moves.length - 1];
    let secondPreviousMove = moves[moves.length - 2];
    if (
        Renju.movesMade(gameState) !== 6
    ) {
        return {valid: false};
    }
    if (
        !((previousMove.row === row && previousMove.column === column) || (
            secondPreviousMove.row === row &&
            secondPreviousMove.column === column
        ))
    ) {
        return {valid: false};
    }
    moves.push({
        row: row,
        column: column,
        playerColour: "black",
        removed: true,
        doubleThree: false,
        doubleFour: false
    });
    board[row][column] = "removed";
    return {gameState: {
        board: board,
        moves: moves
    }, valid: true};
};

/**
 * Attempts to pass a turn according to the rules of Renju.
 * If the pass is valid, it is made and the outcome is returned.
 * If the pass is invalid, the outcome is returned.
 * The pass is only allowed if at least three moves have been made.
 * @memberof Renju
 * @function
 * @param {Renju.playerColour} playerColour The colour of the player who wishes
 * to pass.
 * @param {Renju.gameState} gameState The game state to pass the turn in.
 * @returns {Renju.attemptedMove} The outcome of the attempt.
*/
Renju.attemptPass = function (playerColour, gameState) {
    if (Renju.movesMade(gameState) < 3) {
        return {valid: false};
    }
    if (!checkNormalMove(playerColour, gameState)) {
        return {valid: false};
    }
    let board = R.clone(gameState.board);
    let moves = R.clone(gameState.moves);
    moves.push({
        row: -1,
        column: -1,
        playerColour: playerColour,
        removed: false,
        doubleThree: false,
        doubleFour: false
    });
    return {gameState: {
        board: board,
        moves: moves
    }, valid: true};
};

/**
 * Get the moves made as an array of strings in the format
 * "moveNumber: [playerColour played at row, column]".
 * This is useful for displaying the moves made in a game.
 * @memberof Renju
 * @function
 * @param {Renju.gameState} gameState The game state to get the moves from.
 * @returns {string[]} The moves made as an array of strings.
 * @example
 * Renju.getFormattedMoves(gameState);
 * // => [
 * //   " 1: [black played at 7, 7]",
 * //   " 2: [white played at 7, 8]",
 * //   " 3: [black played at 8, 7]",
 * //   " 4: [white played at 8, 8]",
 * //   " 5: [black played at 9, 7]"
 * // ]
*/
Renju.formattedMoves = function (gameState) {
    let moves = gameState.moves;
    let formattedMoves = [];
    moves.forEach(function (move, index) {
        index += 1;
        if (move.row === -1) {
            formattedMoves.push(
                " " + index + ": [" +
                move.playerColour + " passed" +
                "]"
            );
        } else if (move.removed) {
            formattedMoves.push(
                " " + index + ": [" +
                "White removed the black piece at " +
                move.row +
                ", " +
                move.column +
                "]"
            );
        } else {
            formattedMoves.push(
                " " + index + ": [" +
                move.playerColour +
                " played at " +
                move.row +
                ", " +
                move.column +
                "]"
            );
        }
    });
    return formattedMoves;
};

//HELPER FUNCTIONS

const createBoard = function (width = 15, height = 15, input = null) {
    if (width % 2 === 0 || height % 2 === 0) {
        throw new Error("Board dimensions must be odd numbers");
    }
    return new Array(width).fill().map(() => new Array(height).fill(input));
};

const movesMadeFromBoard = function (board) {
    return R.sum(R.flatten(board).map(function (x) {
        if (x === null) {
            return 0;
        }
        return 1;
    }));
};

const isNextTo = function (row1, column1, row2, column2) {
    return Math.abs(column1 - column2) <= 1 && Math.abs(row1 - row2) <= 1;
};

const getBoardColumnNumber = function (board) {
    return board.length;
};

const getBoardRowNumber = function (board) {
    return board[0].length;
};

const half = function (number) {
    return Math.floor(number / 2);
};

const checkMoveThree = function (playerColour, row, column, board) {
    if (playerColour === "white") {
        return false;
    }
    let newBoard = R.clone(board);
    newBoard[row][column] = playerColour; // add the move to the board
    const middleColumn = half(getBoardColumnNumber(newBoard));
    const middleRow = half(getBoardRowNumber(newBoard));
    let cellAboveMiddle = newBoard[middleRow - 1][middleColumn];
    let cellAccrossMiddle = newBoard[middleRow - 1][middleColumn - 1];
    let wasRotated = false;
    while (
        !(R.equals(
            cellAboveMiddle,
            "white"
        ) || R.equals(
            cellAccrossMiddle,
            "white"
        ))
    ) {
        cellAboveMiddle = newBoard[middleRow][middleColumn - 1];
        cellAccrossMiddle = newBoard[middleRow - 1][middleColumn - 1];
        wasRotated = true;
        newBoard = rotateBoard(newBoard);
    }
    if (!wasRotated && R.equals(cellAccrossMiddle, "white")) {
        newBoard = rotateBoard(newBoard);
    }
    //vertical case
    if (R.equals(cellAboveMiddle, "white")) {
        let validBoardSectionVertical = getBoardSection(
            middleRow - 2,
            middleRow + 2,
            middleColumn,
            middleColumn + 2,
            newBoard
        );
        return movesMadeFromBoard(validBoardSectionVertical) === 3;
    }
    //diagonal case
    if (R.equals(cellAccrossMiddle, "white")) {
        let validBoardSectionDiagonal = [].concat(
            getBoardSection(
                middleRow,
                middleRow + 2,
                middleColumn,
                middleColumn + 2,
                newBoard
            ),
            getBoardSection(
                middleRow - 1,
                middleRow - 1,
                middleColumn + 1,
                middleColumn + 2,
                newBoard
            ),
            getBoardSection(
                middleRow + 1,
                middleRow + 2,
                middleColumn - 1,
                middleColumn - 1,
                newBoard
            ),
            newBoard[middleRow + 2][middleColumn - 2],
            newBoard[middleRow - 2][middleColumn + 2]
        );
        return movesMadeFromBoard(validBoardSectionDiagonal) === 3;
    }
    return false;
};

const checkMoveSeven = function (playerColour, row, column, board) {
    if (playerColour !== "white") {
        return false;
    }
    let temporaryBoard = R.pipe(
        R.clone,
        R.update(row, R.update(column, playerColour)),
        R.flatten
    )(board);
    if (!R.includes("removed", temporaryBoard)) {
        return false;
    }
    temporaryBoard = R.filter((x) => x !== null, temporaryBoard);
    return temporaryBoard.length === 7;
};

const checkNormalMove = function (playerColour, gameState) {
    if (playerColour !== Renju.colourToMove(gameState)) {
        return false;
    }
    return true;
};

const rotateBoard = function (board) {
    return board[0].map(
        (ignore, index) => board.map((row) => row[index]).reverse()
    );
};

const getBoardSection = function (
    startingRow,
    endingRow,
    startingColumn,
    endingColumn,
    board
) {
    return board.slice(startingRow, endingRow + 1).map(
        (row) => row.slice(startingColumn, endingColumn + 1)
    );
};

const checkIfFiveInARow = function (playerColour, board) {
    let numberOfTouchingPieces = totalNumberOfTouchingPieces(
        playerColour,
        board
    );
    return R.includes(5, numberOfTouchingPieces);
};

const checkOverline = function (playerColour, board) {
    let numberOfTouchingPieces = totalNumberOfTouchingPieces(
        playerColour,
        board
    );
    return R.any((x) => x > 5, numberOfTouchingPieces);
};

const blackMakesDoubleThree = function (board) {
    return board.some(function (row, rowIndex) {
        return row.some(function (ignore, columnIndex) {
            let cellsAround = getCellsAround(rowIndex, columnIndex, 2, board);
            let touchingCells = getTouchingCells(cellsAround);
            let numberOfTouchingPieces = totalNumberOfTouchingPieces(
                "black",
                touchingCells
            );
            numberOfTouchingPieces = R.filter(
                (x) => x === 3,
                numberOfTouchingPieces
            );
            return numberOfTouchingPieces.length >= 2;
        });
    });
};

const blackMakesDoubleFour = function (board) {
    return board.some(function (row, rowIndex) {
        return row.some(function (ignore, columnIndex) {
            let cellsAround = getCellsAround(rowIndex, columnIndex, 3, board);
            let touchingCells = getTouchingCells(cellsAround);
            let numberOfTouchingPieces = totalNumberOfTouchingPieces(
                "black",
                touchingCells
            );
            numberOfTouchingPieces = R.filter(
                (x) => x === 4,
                numberOfTouchingPieces
            );
            return numberOfTouchingPieces.length >= 2;
        });
    });
};

const getCellsAround = function (rowIndex, columnIndex, number, board) {
    let cellsAround = [];
    let startingRow = rowIndex;
    let endingRow = rowIndex + 2 * number;
    let startingColumn = columnIndex;
    let endingColumn = columnIndex + 2 * number;
    let temporaryBoard = R.clone(board);
    temporaryBoard = pad2DArray(number, null, temporaryBoard);
    cellsAround = getBoardSection(
        startingRow,
        endingRow,
        startingColumn,
        endingColumn,
        temporaryBoard
    );
    return cellsAround;
};

const getTouchingCells = function (board) {
    const numRows = board.length;
    const numCols = board[0].length;
    const middleRow = Math.floor(numRows / 2);
    const middleCol = Math.floor(numCols / 2);
    const middleValue = board[middleRow][middleCol];
    function isValidCell(row, col) {
        return (
            row >= 0 &&
            row < numRows &&
            col >= 0 &&
            col < numCols &&
            (
                board[row][col] === middleValue ||
                board[row][col] === board[middleRow][middleCol]
            )
        );
    }
    const result = [];
    R.range(0, numRows).forEach(function (i) {
        const row = [];
        R.range(0, numCols).forEach(function (j) {
            if (isValidCell(i, j)) {
                row.push(board[i][j]);
            } else {
                row.push(0);
            }
        });
        result.push(row);
    });
    return result;
};

const totalNumberOfTouchingPieces = function (playerColour, board) {
    let temporaryBoard = R.clone(board);
    let numberOfTouchingPieces = [];
    numberOfTouchingPieces = numberOfTouchingPieces.concat(
        countVerticalTouching(playerColour, temporaryBoard),
        countHorizontalTouching(playerColour, temporaryBoard),
        countDiagonalTouching(playerColour, temporaryBoard)
    );
    return numberOfTouchingPieces;
};

const pad2DArray = function (padding, padValue, board) {
    let paddedArray = new Array(board.length + 2 * padding).fill().map(
        () => new Array(board[0].length + 2 * padding).fill(padValue)
    );
    R.range(0, board.length).forEach(function (rowIndex) {
        R.range(0, board[0].length).forEach(function (columnIndex) {
            paddedArray[rowIndex + padding][columnIndex + padding] = (
                board[rowIndex][columnIndex]
            );
        });
    });
    return paddedArray;
};

const countHorizontalTouching = function (playerColour, board) {
    let touchingPieces = [];
    let touchingInARow = [];
    board.forEach(function (row) {
        touchingInARow = countTouchingInARow(playerColour, row);
        touchingPieces.push(touchingInARow);

    });
    let numberOfTouchingPieces = touchingPieces.map((x) => x.length);
    return numberOfTouchingPieces.filter((x) => x >= 2);
};

const countTouchingInARow = function (playerColour, row) {
    let counter = 1;
    let startingIndex = 0;
    let largestCounter = 1;
    let previousValue = 0;
    row.forEach(function (value, index) {
        if (value === playerColour && value === previousValue) {
            counter += 1;
        } else {
            counter = 1;
        }
        if (counter > largestCounter) {
            largestCounter = counter;
            startingIndex = index - counter + 1;
        }
        previousValue = value;
    });
    return R.range(startingIndex, startingIndex + largestCounter);
};

const countVerticalTouching = function (playerColour, board) {
    return countHorizontalTouching(
        playerColour,
        rotateBoard(board)
    );
};

const countDiagonalTouching = function (playerColour, board) {
    let temporaryBoard = changeDiagonalToHorizontal(R.clone(board));
    return countHorizontalTouching(playerColour, temporaryBoard);
};

const changeDiagonalToHorizontal = function (board) {
    return R.concat(
        changeDiagonalToHorizontalUp(board),
        changeDiagonalToHorizontalDown(board)
    );
};

const changeDiagonalToHorizontalUp = function (board) {
    let result = [];
    let numRows = board.length;
    R.range(0, numRows).forEach(function (i) {
        let row = board[i];
        let numElements = row.length;
        R.range(0, numElements).forEach(function (j) {
            let element = row[j];
            if (!result[j + i]) {
                result[j + i] = [];
            }
            result[j + i].push(element);
        });
    });
    return result;
};

const changeDiagonalToHorizontalDown = function (board) {
    let result = [];
    let numRows = board.length;
    R.range(0, numRows).forEach(function (i) {
        let row = board[numRows - 1 - i];
        let numElements = row.length;
        R.range(0, numElements).forEach(function (j) {
            let element = row[j];
            if (!result[j + i]) {
                result[j + i] = [];
            }
            result[j + i].push(element);
        });
    });
    return result;
};

const removeLastMove = function (gameState) {
    let newGameState = R.clone(gameState);
    let lastMove = newGameState.moves.pop();
    newGameState.board[lastMove.row][lastMove.column] = null;
    return newGameState;
};

const isBoardFull = function (board) {
    return R.all((row) => R.all((x) => x !== null, row), board);
};

export default Object.freeze(Renju);