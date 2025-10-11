import {Config} from './constants';

export const rotate = (piece: Array<Array<number>>): Array<Array<number>> => {
    const h = piece.length;
    const w = piece[0].length;
    const rotated: Array<Array<number>> =
        Array.from({length: w}, () => Array(h).fill(0));

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            rotated[x][h - 1 - y] = piece[y][x];
        }
    }

    return rotated;
};

export const areEqual = (a: Array<Array<number>>, b: Array<Array<number>>): boolean => {
    if (a.length !== b.length || a[0].length !== b[0].length) {
        return false;
    }
    return a.every((row, i) => row.every((val, j) => val === b[i][j]));
};

/** Return the index of the last row in the provided piece that has a 1 in it PLUS one. */
export const numRowsBeforeEmptyRows = (piece: number[][]) => {
    for (let row = piece.length - 1; row >= 0; row--) {
        if (piece[row].some(cell => cell === 1)) {
            return row + 1;
        }
    }
    return 0;
};

export const logicalWidthOfPiece = (piece: number[][]) => {
    let minColIdx = piece.length - 1, maxColIdx = 0;
    for (let row = piece.length - 1; row >= 0; row--) {
        const idx = piece[row].indexOf(1);
        if (idx !== -1) {
            minColIdx = Math.min(minColIdx, idx);
            maxColIdx = Math.max(maxColIdx, idx);
        }
    }
    return (maxColIdx - minColIdx) + 1;
};

export const removeRow_ = <T>(state: T[][], row: number, defaultValue: T) => {
    state.splice(row, 1);
    state.unshift(Array(Config.Cols).fill(defaultValue));
};
