import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    ActionSequence,
    Actor,
    ActorArgs,
    Color,
    Engine,
    Font,
    FontUnit,
    Handler,
    InitializeEvent,
    Label,
    ParallelActions,
    Rectangle,
    vec,
    Vector
} from 'excalibur';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
};

// --

const gridSquareMargin = 3;
const gridOuterMargin = 5;

const createMatrix = (rows: number, cols: number) => {
    return Array.from({length: rows}, () => Array(cols).fill(null));
};

const createOpenRect = (
    width: number, height?: number, color: Color = Color.LightGray, lineWidth: number = 2, dashed: boolean = true) => {
    return new Rectangle({
        width: width,
        height: height || width,
        lineWidth: lineWidth,
        strokeColor: color,
        color: Color.Transparent,
        ...(dashed ? {lineDash: [4, 4]} : {})
    });
};

const createInvisibleBoundsRect = (width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        color: Color.Transparent,
        // strokeColor: Color.Red,
        // lineWidth: 1
    });
};

// --

const modalFont = new Font({
    color: Color.White,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 18
});

const createModal = (message: string, darkBgColor: Color, marginX: number = 15, marginY: number = 10) => {
    const m = modalFont.measureText(message);
    const modal = new Actor({
        anchor: Vector.Zero,
        width: m.width + marginX,
        height: m.height + marginY,
        color: darkBgColor,
        z: 200
    });
    const label = new Label({
        text: message,
        font: modalFont,
        color: Color.White
    });
    modal.on('initialize', (e: InitializeEvent) => {
        label.anchor = Vector.Half;
        label.pos = vec(modal.width / 2, modal.height / 2);
        modal.addChild(label);

        modal.pos = vec((e.engine.drawWidth - modal.width) / 2,
            (e.engine.drawHeight - modal.height - 75));
    });
    return modal;
};

// --

const shuffle_ = (matrix: number[][], [zeroRow, zeroCol]: [number, number]) => {
    let currZeroRow = zeroRow;
    let currZeroCol = zeroCol;
    for (let i = 0; i < 1000; ++i) {
        const candidates = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([rOff, cOff]) => {
            return [currZeroRow + rOff, currZeroCol + cOff];
        }).filter(([r, c]) => {
            return r >= 0 && r < 4 && c >= 0 && c < 4;
        });
        const [nextZeroRow, nextZeroCol] = candidates[Math.floor(Math.random() * candidates.length)];
        matrix[currZeroRow][currZeroCol] = matrix[nextZeroRow][nextZeroCol];
        matrix[nextZeroRow][nextZeroCol] = 0;
        [currZeroRow, currZeroCol] = [nextZeroRow, nextZeroCol];
    }
};

const equal2d = <T>(a: T[][], b: T[][]): boolean =>
    a.length === b.length &&
    a.every((row, i) =>
        row.length === b[i].length && row.every((val, j) => val === b[i][j]));

const find2d = <T>(a: T[][], b: T): [number, number] | undefined => {
    for (let row = 0; row < a.length; ++row) {
        for (let col = 0; col < a[row].length; ++col) {
            if (a[row][col] === b) {
                return [row, col];
            }
        }
    }
    return undefined;
};

/** PuzzleGrid. */
class PuzzleGrid extends Actor {
    private readonly moveableBlocks: (Actor | undefined)[][];
    private readonly state: number[][];
    private squareDim: number | undefined;
    private currEmptyPos: Vector | undefined;
    private currEmptyRowCol: [number, number] | undefined;

    constructor(config: ActorArgs, startingState: number[][]) {
        super({
            anchor: Vector.Zero,
            ...config
        });
        this.moveableBlocks = createMatrix(4, 4);
        this.state = startingState;
    }

    onInitialize(engine: Engine) {
        super.onInitialize(engine);
        this.squareDim = Math.min(
            Math.floor((engine.drawWidth - 4 * gridSquareMargin - 2 * gridOuterMargin) / 4/*!*/),
            Math.floor((engine.drawHeight - 4 * gridSquareMargin - 2 * gridOuterMargin) / 4/*!*/));
        for (let row = 0; row < 4; ++row) {
            for (let col = 0; col < 4; ++col) {
                const rect = createOpenRect(this.squareDim, this.squareDim, Color.LightGray, 6, true);
                const gridBlock = new Actor();
                gridBlock.graphics.use(rect);
                gridBlock.pos = vec(col * (this.squareDim + gridSquareMargin) + this.squareDim / 2,
                    row * (this.squareDim + gridSquareMargin) + this.squareDim / 2);
                this.addChild(gridBlock);
                if (this.state[row][col] > 0) {
                    const moveableBlock = new Actor({
                        pos: gridBlock.pos,
                        anchor: gridBlock.anchor,
                        z: 100
                    });
                    moveableBlock.graphics.use(
                        createOpenRect(this.squareDim, this.squareDim, this.color, 6, false));

                    moveableBlock.addChild(xel.actors.fromText(`${this.state[row][col]}`, {
                        scale: vec(1.5, 1.5),
                        color: this.color
                    }));
                    moveableBlock.on('pointerdown', e => {
                        const [clickedRow, clickedCol] = find2d(this.moveableBlocks, moveableBlock)!;
                        const [currEmptyRow, currEmptyCol] = this.currEmptyRowCol!;
                        if (clickedRow === currEmptyRow) {
                            const sign = Math.sign(clickedCol - currEmptyCol);
                            for (let colToMove = currEmptyCol + sign; ; colToMove += sign) {
                                const [currEmptyRow, currEmptyCol] = this.currEmptyRowCol!;
                                const currMovableBlock = this.moveableBlocks[clickedRow][colToMove]!;
                                const nextEmptyPos = currMovableBlock.pos.clone();
                                currMovableBlock.actions.moveTo({
                                    pos: this.currEmptyPos!,
                                    duration: 50
                                });
                                this.moveableBlocks[currEmptyRow][currEmptyCol] = currMovableBlock;
                                this.moveableBlocks[clickedRow][colToMove] = undefined;
                                this.state[currEmptyRow][currEmptyCol] = this.state[clickedRow][colToMove];
                                this.state[clickedRow][colToMove] = 0;
                                this.currEmptyRowCol = [clickedRow, colToMove];
                                this.currEmptyPos = nextEmptyPos;
                                if (colToMove === clickedCol) {
                                    break;
                                }
                            }
                        } else if (clickedCol === currEmptyCol) {
                            const sign = Math.sign(clickedRow - currEmptyRow);
                            for (let rowToMove = currEmptyRow + sign; ; rowToMove += sign) {
                                const [currEmptyRow, currEmptyCol] = this.currEmptyRowCol!;
                                const currMovableBlock = this.moveableBlocks[rowToMove][clickedCol]!;
                                const nextEmptyPos = currMovableBlock.pos.clone();
                                currMovableBlock.actions.moveTo({
                                    pos: this.currEmptyPos!,
                                    duration: 50
                                });
                                this.moveableBlocks[currEmptyRow][currEmptyCol] = currMovableBlock;
                                this.moveableBlocks[rowToMove][clickedCol] = undefined;
                                this.state[currEmptyRow][currEmptyCol] = this.state[rowToMove][clickedCol];
                                this.state[rowToMove][clickedCol] = 0;
                                this.currEmptyRowCol = [rowToMove, clickedCol];
                                this.currEmptyPos = nextEmptyPos;
                                if (rowToMove === clickedRow) {
                                    break;
                                }
                            }
                        }
                        this.emit('*update', this.state);
                    });
                    this.moveableBlocks[row][col] = moveableBlock;
                    this.addChild(moveableBlock);
                } else {
                    this.currEmptyPos = gridBlock.pos;
                    this.currEmptyRowCol = [row, col];
                }
            }
        }
        const bounds = createInvisibleBoundsRect(
            4 * (this.squareDim + gridSquareMargin) - gridSquareMargin,
            4 * (this.squareDim + gridSquareMargin) - gridSquareMargin);
        // assumes this.anchor = Vector.Zero
        this.graphics.add('bounds', bounds);
        this.graphics.use('bounds');
        this.pos = vec(
            Math.round((engine.drawWidth - this.graphics.localBounds.width) / 2),
            Math.round((engine.drawHeight - this.graphics.localBounds.width) / 2));
    }

    jiggle() {
        let promises = [];
        for (let row of this.moveableBlocks) {
            for (let item of row) {
                if (item) {
                    const originalPos = item.pos;
                    const rot = new ActionSequence(item, ctx => {
                        ctx.repeat(ctx => {
                            const sign = Math.random() > 0.5 ? 1 : -1;
                            return ctx.rotateTo({
                                angle: sign * (0.30 + Math.random() * 0.3),
                                duration: 75
                            }).rotateTo({
                                angle: sign * (-0.30 + Math.random() * 0.3),
                                duration: 75
                            });
                        }, 1);
                    });
                    const mot = new ActionSequence(item, ctx => {
                        ctx.repeat(ctx => {
                            const signX = Math.random() > 0.5 ? 1 : -1;
                            const signY = Math.random() > 0.5 ? 1 : -1;
                            const deltaX = Math.random() * 8;
                            const deltaY = Math.random() * 8;
                            return ctx.moveBy({
                                offset: vec(signX * deltaX, signY * deltaY),
                                duration: 75
                            }).moveBy({
                                offset: vec(signX * -deltaX, signY * -deltaY),
                                duration: 75
                            });
                        }, 1);
                    });
                    const p = new ParallelActions([rot, mot]);
                    const prom = item.actions.runAction(p).toPromise().then(() => {
                        return item.actions.moveTo({
                            pos: originalPos,
                            duration: 0
                        }).rotateTo({
                            angle: 0,
                            duration: 0
                        }).toPromise();
                    });
                    promises.push(prom);
                }
            }
        }
        return Promise.all(promises);
    }
}

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const themeColor = context.color.fg;
    const solution = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 0]];
    const puzzle = solution.map(row => [...row]);
    shuffle_(puzzle, [3, 3]);
    const grid = new PuzzleGrid({color: themeColor}, puzzle);

    let enteredTime: number | undefined = undefined;
    engine.on('xelly:enter', () => {
        enteredTime = Date.now();
    });

    grid.on('*update', ((state: number[][]) => {
        if (equal2d(state, solution)) {
            const totalSeconds = Math.floor((Date.now() - enteredTime!) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            const secondsText = seconds >= 1 ? 'seconds' : 'second';
            const minutesText = minutes >= 1 ? 'minutes' : 'minute';

            grid.jiggle().then(() => {
                engine.add(createModal(minutes > 0 ?
                    `you won in ${minutes} ${minutesText}, ${seconds} ${secondsText}` : `you won in ${seconds} ${secondsText}`, themeColor));
                engine.emit('xelly:terminate');
            });
        }
    }) as Handler<any>);
    engine.add(grid);
};
