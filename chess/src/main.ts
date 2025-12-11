import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Actor, Color, Engine, Handler, vec, Vector} from 'excalibur';
import {Chess, Move, Square} from 'chess.js';
import {Board, createBoardConfig, DarkSquareColor} from './board';
import {rowColToSquare, setup, squareToRowCol} from './support';
import {load as loadSprites} from './sprites';
import {maybeCreatePromotionChooser} from './promote';
import {createSkillPicker} from './skill';

// --

const message = (engine: Engine, msg: string) => {
    const graphic = xel.graphics.fromText(msg, {
        color: DarkSquareColor,
        backgroundColor: Color.fromRGB(255, 255, 255, 0.80),
        cssWidthAndHeightOverride: (spriteWidthAndHeight) =>
            vec(engine.drawWidth, spriteWidthAndHeight.y + 35),
    });
    const actor = new Actor({
        anchor: Vector.Zero,
        pos: vec(0, Math.floor(engine.drawHeight / 2 - graphic.height / 2)),
        z: 1000
    });
    actor.graphics.use(graphic);
    return actor;
};

// --

export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased,
    deps: ['chess']
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const chessServer = context.deps!['chess'] as any;
    chessServer.initGame().then((res: any) => {
        console.log('chess server init game result:', res); // todo
    });

    let skillLevel = 6;

    const margin = 26;
    const idealExteriorDim
        = Math.min(engine.drawWidth - margin, engine.drawHeight - margin);
    const halfBorder = 2;

    const boardConfig = createBoardConfig(halfBorder, idealExteriorDim);

    //const chess = new Chess('k7/4P3/8/8/8/8/8/4K3 w - - 0 1');
    const chess = new Chess();

    const handleTermination = (engine: Engine, chess: Chess) => {
        if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
                engine.add(message(engine, `${chess.turn() === 'w' ? 'Black wins :(' : 'You won!'}`));
            } else if (chess.isStalemate()) {
                engine.add(message(engine, 'stalemate'));
            } else if (chess.isDraw()) {
                engine.add(message(engine, 'draw'));
            }
            engine.emit('xelly:terminate');
            return true;
        }
        return false;
    };

    let activeSquare: Square | undefined = undefined;

    loadSprites().then((ss) => {
        const board = new Board(boardConfig);
        board.pos = vec(
            Math.floor((engine.drawWidth - boardConfig.dim) / 2),
            Math.floor((engine.drawHeight - boardConfig.dim) / 2));
        engine.add(board);

        const triggerOpponentMove = async () => {
            const waitProm = new Promise(r => setTimeout(r, 150));
            const bestMoveProm = chessServer.bestMoveForFen(skillLevel, chess.fen());
            await waitProm; // ...at least wait this long
            const bestMove = await bestMoveProm;
            const moves = chess.moves({verbose: true});
            const found =
                moves.filter(move => {
                    return move.from === bestMove.from && move.to === bestMove.to;
                });
            if (found.length !== 1) {
                // todo error
                return;
            }
            const useMove = found[0];
            const [fromRow, fromCol] = squareToRowCol(useMove.from);
            const [toRow, toCol] = squareToRowCol(useMove.to);
            await board.move(ss, {
                from: {row: fromRow, col: fromCol},
                to: {row: toRow, col: toCol},
                kill: useMove.isEnPassant() ? {
                    row: fromRow,
                    col: toCol
                } : undefined,
                from2: useMove.isKingsideCastle() ? {row: fromRow, col: 7}
                    : useMove.isQueensideCastle() ? {
                        row: fromRow,
                        col: 0
                    } : undefined,
                to2: useMove.isKingsideCastle() ? {
                        row: fromRow,
                        col: toCol - 1
                    }
                    : useMove.isQueensideCastle() ? {
                        row: fromRow,
                        col: toCol + 1
                    } : undefined,
            }, 'system');
            chess.move(useMove); // ...to make it turn() === 'w'
            handleTermination(engine, chess);
        };

        const clearActiveSquare = () => {
            activeSquare = undefined;
            board.clearHighlightAndDotsAndHalos();
        };
        const setOrChangeActiveSquare = (row: number, col: number) => {
            clearActiveSquare();
            activeSquare = rowColToSquare(row, col);
            board.highlight(row, col);
            const processed = new Set<string>();
            chess.moves({verbose: true, square: activeSquare}).forEach(move => {
                const [row, col] = squareToRowCol(move.to);
                const key = `${row},${col}`;
                // e.g., in case of promition options we may see same row/col multiple
                //  times in the list of moves
                if (!processed.has(key)) {
                    processed.add(key);
                    board.dotOrHalo(row, col);
                }
            });
        };
        let handlingClick = false;

        const completeMove = (move: Move, useActiveSquare: Square, promotionFenLetter: string | undefined, toRow: number, toCol: number) => {
            const [activeRow, activeCol] = squareToRowCol(useActiveSquare);
            board.clearHighlightAndDotsAndHalos();
            return board.move(ss, {
                promotion: promotionFenLetter,
                from: {row: activeRow, col: activeCol},
                to: {row: toRow, col: toCol},
                kill: move.isEnPassant() ? {
                    row: activeRow,
                    col: toCol
                } : undefined,
                from2: move.isKingsideCastle() ? {row: toRow, col: 7}
                    : move.isQueensideCastle() ? {
                        row: toRow,
                        col: 0
                    } : undefined,
                to2: move.isKingsideCastle() ? {
                        row: toRow,
                        col: toCol - 1
                    }
                    : move.isQueensideCastle() ? {
                        row: toRow,
                        col: toCol + 1
                    } : undefined,
            }, 'human').then(async () => {
                clearActiveSquare();
                chess.move(move);
                if (!handleTermination(engine, chess)) {
                    triggerOpponentMove();
                }
            });
        };

        board.on('click*', (({row, col, sqColor}: {row: number, col: number, sqColor: Color}) => {
            if (handlingClick) {
                return;
            }
            handlingClick = true;
            if (chess.turn() !== 'w') {
                handlingClick = false;
                return;
            }
            const clickedSquare = rowColToSquare(row, col);
            const clickedPiece = chess.get(clickedSquare);
            if (activeSquare) {
                if (activeSquare === clickedSquare) {
                    activeSquare = undefined;
                    board.clearHighlightAndDotsAndHalos();
                    handlingClick = false;
                } else if (clickedPiece && clickedPiece.color === 'w') {
                    setOrChangeActiveSquare(row, col);
                    handlingClick = false;
                } else {
                    const clickedValidMoves = chess.moves({verbose: true, square: activeSquare})
                        .filter(m => m.to === clickedSquare);
                    if (clickedValidMoves.length > 0) {
                        const chooser = maybeCreatePromotionChooser(ss, boardConfig, clickedValidMoves, sqColor, Color.Black/*todo*/);
                        if (chooser) {
                            chooser.pos = vec(
                                Math.floor(engine.drawWidth / 2 - chooser.graphics.current!.width / 2),
                                Math.floor(engine.drawHeight / 2 - chooser.graphics.current!.height / 2))
                            engine.add(chooser);
                            board.dim();
                            chooser.once('click*', (({promotionPieceLetter}: {promotionPieceLetter: string}) => {
                                board.undim();
                                engine.remove(chooser);
                                const validMove = clickedValidMoves.filter(m => m.promotion === promotionPieceLetter);
                                const fenLetter = (chess.turn() === 'w'/*expected*/ ? promotionPieceLetter.toUpperCase() : promotionPieceLetter);
                                completeMove(validMove[0], activeSquare!, fenLetter, row, col).then(() => {
                                    handlingClick = false;
                                });
                            }) as Handler<any>);
                        } else {
                            completeMove(clickedValidMoves[0], activeSquare, undefined, row, col).then(() => {
                                handlingClick = false;
                            });
                        }
                    } else {
                        // had active piece, but click was not a valid move
                        clearActiveSquare();
                        handlingClick = false;
                    }
                }
            } else {
                if (clickedPiece && clickedPiece.color === 'w') {
                    setOrChangeActiveSquare(row, col);
                }
                handlingClick = false;
            }

        }) as Handler<any>);

        setup(board, chess, ss);

        const picker = createSkillPicker(engine, skillLevel);
        picker.on('*skill', ((skill: number) => {
            skillLevel = skill;
        }) as Handler<any>);
        engine.add(picker);
    });
};
