import {Config, Pieces, PieceType} from './constants';
import {Piece} from './piece';
import {Color, Engine, Random, vec} from 'excalibur';
import {numRowsBeforeEmptyRows, removeRow_} from './util';
import {Grid} from './grid';

export type CurrentPieceInfo = {
    type: PieceType;
    piece: Piece;
    row: number;
    col: number;
};

type InitState = {
    themeColor: Color;
    grid: Grid;
    numPiecesSpawned: number;
    numLinesCleared: number;
    score: number;
    data: number[][];
    nextPieceType: PieceType;
};

export type State = InitState & {
    currentPiece: CurrentPieceInfo;
};

const random = new Random();

const updateEntityPos = (state: State) => {
    state.currentPiece.piece.pos
        = state.grid.pos.add(
        vec(
            (Config.BlockSpacing + state.grid.blockPixelDim) * state.currentPiece.col + Config.BlockSpacing,
            (Config.BlockSpacing + state.grid.blockPixelDim) * state.currentPiece.row + Config.BlockSpacing));
}

const pieceCache = new Map<string, Piece>();
const getPiece = (type: PieceType, themeColor: Color, blockPixelDim: number) => {
    const got = pieceCache.get(type.name);
    if (got) {
        got.reset();
        return got;
    }
    const entity = new Piece(themeColor, blockPixelDim, type.blocks);
    pieceCache.set(type.name, entity);
    return entity;
};

const internalSpawn = (state: InitState, engine: Engine): State => {
    const pick = state.nextPieceType;
    const entity = getPiece(pick, state.themeColor, state.grid.blockPixelDim);
    const widthOfPieceInBlocks = entity.asMatrix()[0].length;
    const enterCol = Math.floor((Config.Cols - widthOfPieceInBlocks) / 2);
    const enterRow = -numRowsBeforeEmptyRows(entity.asMatrix());
    const nextState = {
        ...state,
        numPiecesSpawned: state.numPiecesSpawned + 1,
        nextPieceType: random.pickOne(Pieces),
        currentPiece: {
            type: pick,
            piece: entity,
            row: enterRow,
            col: enterCol,
        },
    };
    updateEntityPos(nextState); // mutation!
    engine.add(entity);
    return nextState;
};

export const spawnFirstPieceAndInitState = (engine: Engine, themeColor: Color, grid: Grid): State => {
    return internalSpawn({
        themeColor,
        grid,
        numLinesCleared: 0,
        numPiecesSpawned: 0,
        score: 0,
        nextPieceType: random.pickOne(Pieces),
        data: Array.from({length: Config.Rows}, () => Array(Config.Cols).fill(0))
    }, engine);
};

// --

const canMove = (state: State, direction: 'left' | 'right' | 'down' | 'stay') => {
    const directionAsVec = direction === 'left' ? vec(-1, 0) :
        direction === 'right' ? vec(1, 0) :
            direction === 'down' ? vec(0, 1) :
                vec(0, 0);
    const currentPieceAsMatrix = state.currentPiece!.piece.asMatrix();
    for (let pieceRow = 0; pieceRow < currentPieceAsMatrix.length; pieceRow++) {
        for (let pieceCol = 0; pieceCol < currentPieceAsMatrix[pieceRow].length; pieceCol++) {
            if (currentPieceAsMatrix[pieceRow][pieceCol] === 1) {
                const nextPiecePartLoc = vec(
                    state.currentPiece!.col + pieceCol + directionAsVec.x,
                    state.currentPiece!.row + pieceRow + directionAsVec.y);
                if (nextPiecePartLoc.x < 0 || nextPiecePartLoc.x >= Config.Cols) {
                    return false;
                } else if (nextPiecePartLoc.y >= Config.Rows) {
                    return false;
                } else if (nextPiecePartLoc.x >= 0 && nextPiecePartLoc.y >= 0
                    && state.data[nextPiecePartLoc.y][nextPiecePartLoc.x] === 1) {
                    return false;
                }
            }
        }
    }
    return true;
};

const fixateCurrentPiece = (state: State): {
    state: InitState,
    fixatedPiece: Piece,
    updatedRows: number[]
} => {
    const updatedRows: number[] = [];
    const currentPieceAsMatrix = state.currentPiece!.piece.asMatrix();
    for (let pieceRow = 0; pieceRow < currentPieceAsMatrix.length; pieceRow++) {
        for (let pieceCol = 0; pieceCol < currentPieceAsMatrix[pieceRow].length; pieceCol++) {
            if (currentPieceAsMatrix[pieceRow][pieceCol] === 1) {
                state.data[state.currentPiece.row + pieceRow][state.currentPiece.col + pieceCol] = 1; // mutation!
                state.grid.addBlock(state.currentPiece.row + pieceRow, state.currentPiece.col + pieceCol); // mutation!
                if (!updatedRows.includes(state.currentPiece.row + pieceRow)) {
                    updatedRows.push(state.currentPiece.row + pieceRow); // add updated rows in order!
                }
            }
        }
    }
    const {currentPiece, ...rest} = state;
    return {
        state: rest, // InitState
        fixatedPiece: currentPiece!.piece,
        updatedRows
    };
};

export const tryMove = (state: State, direction: 'left' | 'right' | 'down' | 'stay'): {
    nextState: State,
    success: boolean
} => {
    if (!canMove(state, direction)) {
        return {
            nextState: state,
            success: false
        }; // can't move!
    }
    if (direction === 'left' || direction === 'right' || direction === 'down') {
        const nextState = {
            ...state,
            currentPiece: {
                ...state.currentPiece,
                col: state.currentPiece!.col + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0),
                row: state.currentPiece!.row + (direction === 'down' ? 1 : 0),
            }
        };
        updateEntityPos(nextState);
        return {
            nextState,
            success: true
        };
    } else { // (direction === 'stay')
        return {
            nextState: state,
            success: true
        };
    }
};

export const tryRotate = (state: State, direction: 'left' | 'right'): {
    nextState: State,
    success: boolean
} => {
    state.currentPiece.piece.rotate(direction === 'left' ? -1 : 1);
    const result = tryMove(state, 'stay');
    if (!result.success) {
        state.currentPiece.piece.rotate(direction === 'left' ? 1 : -1);
    }
    return {
        nextState: state,
        success: result.success
    };
};

let ticking = false;

export const toLevel = (state: InitState) => {
    return Math.floor(state.numLinesCleared / 10);
};

const numRowsRemovedToPoints_ = (state: InitState, numRowsRemoved: number) => {
    /*Modern “Guideline”
Single: 100 × level
Double: 300 × level
Triple: 500 × level
Tetris: 800 × level
T-Spin Mini: 100 × level
T-Spin Single/Double/Triple: 800 / 1200 / 1600 × level
Back-to-Back (Tetris/T-Spin): +50%
Combo: ~50 × (streak-1) × level (varies)
Soft/Hard drop: +1 / +2 per cell
Perfect Clear (All Clear): ~3500 (varies)*/
    const level = toLevel(state);
    if (numRowsRemoved === 1) return 100 * (level + 1);
    if (numRowsRemoved === 2) return 300 * (level + 1);
    if (numRowsRemoved === 3) return 500 * (level + 1);
    if (numRowsRemoved === 4) return 800 * (level + 1);
    return 0;
};

export const tick =
    async (state: State, engine: Engine, shakeOnFixate: boolean): Promise<{
        nextState: State,
        result: 'success' | 'skipped' | 'game-over' | 'success-and-spawned-piece'
    }> => {
        if (ticking) {
            return {
                result: 'skipped',
                nextState: state
            };
        }
        ticking = true;
        const result = tryMove(state, 'down');
        if (result.success) {
            ticking = false;
            return {
                result: 'success',
                nextState: result.nextState
            };
        } else {
            if (state.currentPiece!.row < 0) {
                ticking = false;
                return {
                    result: 'game-over',
                    nextState: result.nextState
                };
            } else {
                const {
                    state: nextState,
                    updatedRows,
                    fixatedPiece
                } = fixateCurrentPiece(result.nextState);
                fixatedPiece.kill();
                let rowsToRemove = [];
                for (let updateRow of updatedRows) { // updatedRows are increasing order!
                    if (nextState.data[updateRow].every(item => item === 1)) {
                        removeRow_(nextState.data, updateRow, 0); // mutate!
                        rowsToRemove.push(updateRow);
                    }
                }
                let shakeProm: Promise<void> = Promise.resolve();
                if (shakeOnFixate) {
                    engine.currentScene.camera.shake(6, 6, 250);
                    shakeProm =  new Promise(res => setTimeout(res, 250));
                    await shakeProm; // !!
                }
                return nextState.grid.removeRows(rowsToRemove).then(async () => {
                    // await shakeProm;
                    const nextStateAfterSpawn = internalSpawn({
                        ...nextState,
                        score: nextState.score + numRowsRemovedToPoints_(nextState, rowsToRemove.length),
                        numLinesCleared: nextState.numLinesCleared + rowsToRemove.length,
                    }, engine);
                    ticking = false;
                    return {
                        result: 'success-and-spawned-piece',
                        nextState: nextStateAfterSpawn
                    };
                });
            }
        }
    };
