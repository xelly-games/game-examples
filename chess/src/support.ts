import {Board} from './board';
import {Actor, Graphic, vec} from 'excalibur';
import {getSpriteFromFenLetter, SpriteSheetInfo} from './sprites';
import {Chess, Square} from 'chess.js';

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const actor = (g: Graphic) => {
    const a = new Actor({});
    a.graphics.use(g);
    return a;
};

export const setup = (board: Board, chess: Chess, ss: SpriteSheetInfo) => {
    const pieceTargetDim = board.config.squareDim - 8;
    const pieces = chess.board();
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = pieces[row][col];
            if (piece) {
                const fenLetter = (piece.color === 'w' ? piece.type.toUpperCase() : piece.type);
                board.place(
                    actor(getSpriteFromFenLetter(ss, fenLetter, pieceTargetDim)),
                    row, col);
            }
        }
    }
};

export const rowColToSquare = (row: number, col: number): Square => {
    return (COLS[col] + (8 - row)) as Square;
};

export const squareToRowCol = (square: Square): [number, number] => {
    const col = COLS.indexOf(square.charAt(0));
    const row = 8 - parseInt(square.charAt(1));
    return [row, col];
};
