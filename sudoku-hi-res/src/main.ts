import {
    Actor,
    Color,
    Engine,
    Font,
    FontUnit,
    Label,
    vec,
    Vector
} from 'excalibur';
import xel, {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme,
    XellySpriteActor
} from '@xelly/xelly.js';
import {SudokuCreator} from '@algorithm.ts/sudoku'

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased,
    pixelScheme: XellyPixelScheme.Px2_0
};

// --

function arrayEq(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

// --

const createFont = (color: Color, sizePx: number, familyOverride?: string) => {
    return new Font({
        color,
        size: sizePx,
        family: familyOverride || 'serif', // 'system-ui',
        unit: FontUnit.Px
    });
};

// --

/** Square. */
class Square extends XellySpriteActor {

    private readonly dim: number;
    private readonly pointerChild?: Actor;
    private valueChild?: Actor;

    constructor(context: XellyContext, pixelX: number, pixelY: number, dim: number, fixedValue?: number) {
        let mainSprite = xel.create.rect(0, 0, dim, dim);
        super(xel.actorArgs.fromPixelBasedArgs(context, {
            x: pixelX,
            y: pixelY,
            anchor: Vector.Zero,
        }), context, mainSprite);
        this.on('pointerdown', (e) => {
            this.emit('square:clickaway');
            e.cancel();
        });
        this.dim = dim;
        if (fixedValue !== undefined) {
            this.valueChild = this.createLabelEntity(fixedValue, true);
            this.addChild(this.valueChild);
        } else {
            // the invisible clickable entity:
            this.pointerChild = this.pointerChild = new Actor(xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                offset: vec(1, 1),
                width: dim - 2,
                height: dim - 2,
                opaque: false,
                z: 1
            }));
            this.addChild(this.pointerChild);
        }
    }

    override onInitialize(engine: Engine): void {
        if (this.pointerChild) {
            this.pointerChild.on('pointerdown', (e) => {
                this.emit('box:click');
                e.cancel();
            });
        }
    }

    createLabelEntity(val: number, fixed?: boolean) {
        const squareDimCss = xel.convert.toCssScale(this.context, this.dim);
        const font = createFont(fixed ? Color.Black : this.context.color.fg,
            Math.round(squareDimCss * 0.6));
        const text = `${val}`;
        const m = font.measureText(text);
        return new Label({
            pos: vec((squareDimCss - m.width) / 2, (squareDimCss - m.height) / 2),
            text: `${val}`,
            font: font
        });
    }

    clearUserValue() {
        this.setUserValue(undefined);
    }

    setUserValue(val: number | undefined) {
        if (this.valueChild) {
            this.removeChild(this.valueChild);
            this.valueChild = undefined;
        }
        if (val !== undefined) {
            this.valueChild = this.createLabelEntity(val);
            this.addChild(this.valueChild);
        }
    }

}

const PickerMargin = 5;

class Picker extends XellySpriteActor {

    private readonly squareDim: number;

    constructor(context: XellyContext, squareDim: number) {
        super({z: 1000, anchor: Vector.Zero}, context,
            xel.create.rect(0, 0, PickerMargin * 2 + squareDim * 3, PickerMargin * 2 + squareDim * 4),
            {bgAlpha: 0.95});
        this.squareDim = squareDim;
        this.on('pointerdown', (e) => {
            this.emit('picker:cancel');
            e.cancel();
        });
    }

    override onInitialize(engine: Engine): void {
        const pickerMarginCss = xel.convert.toCssScale(this.context, PickerMargin);
        for (let i = 1; i < 11; ++i) {
            const row = Math.floor((i - 1) / 3);
            let col = (i - 1) % 3;
            if (i === 10) {
                col++;
            }
            const squareDimCss = xel.convert.toCssScale(this.context, this.squareDim);
            const font = createFont(this.context.color.fg, Math.round(squareDimCss * 0.8)/*, 'monospace'*/);
            const text = `${i === 10 ? '_' : i}`;
            const m = font.measureText(text);
            const label = new Label({
                anchor: Vector.Zero,
                pos: vec(
                    pickerMarginCss + col * squareDimCss + 0.5 * (squareDimCss - m.width),
                    pickerMarginCss + row * squareDimCss + 0.5 * (squareDimCss - m.height)),
                text: `${text}`,
                font: font
            });
            this.addChild(label);
            const block = new Actor({
                anchor: Vector.Zero,
                pos: vec(pickerMarginCss + col * squareDimCss,
                    pickerMarginCss + row * squareDimCss),
                width: squareDimCss,
                height: squareDimCss,
                z: 3000
            });
            block.on('pointerdown', (e) => {
                this.emit('picker:select', i);
                e.cancel();
            });
            this.addChild(block);
        }
    }

}

// -- context.parameters --

const readPuzzleFromContextConfig = (context: XellyContext) => {
    if (context.parameters?.gameConfig && context.parameters?.gameConfig.trim()) {
        try {
            return JSON.parse(context.parameters.gameConfig);
        } catch (e) {
            console.warn("couldn't parse game config", e);
            return undefined;
        }
    }
    return undefined;
};

type TerminationGameState = {
    totalSeconds: number
};

const createTerminationResult = (totalSeconds: number) => {
    const payload: TerminationGameState = {
        totalSeconds
    };
    return JSON.stringify(payload);
};

const readGameStateFromContextParameters = (context: XellyContext) => {
    if (context.parameters?.userGameState && context.parameters?.userGameState.trim()) {
        const theGameState = context.parameters.userGameState.trim();
        try {
            return JSON.parse(theGameState) as TerminationGameState;
        } catch (e) {
            console.warn("couldn't parse game state", e);
            return undefined;
        }
    }
    return undefined;
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const puzzleFromConfig = readPuzzleFromContextConfig(context);
    const userGameState = readGameStateFromContextParameters(context);
    let usePuzzle: number[];
    let useSolution: number[];
    if (puzzleFromConfig) {
        usePuzzle = (puzzleFromConfig.puzzle as number[]).map(x => x < 0 ? x : x + 1);
        useSolution = (puzzleFromConfig.solution as number[]).map(x => x < 0 ? x : x + 1);
    } else {
        // @see https://github.com/guanghechen/algorithm.ts/tree/@algorithm.ts/sudoku@4.0.2/packages/sudoku
        const creator = new SudokuCreator({ childMatrixWidth: 3 });
        const easy = creator.createSudoku(0.3);
        const puzzle = easy.puzzle.map(x => x < 0 ? x : x + 1);
        const solution = easy.solution.map(x => x < 0 ? x : x + 1);
        usePuzzle = puzzle;
        useSolution = solution;
    }

    let runtimeUserState: number[];
    if (userGameState) {
        runtimeUserState = useSolution;
    } else {
        runtimeUserState = usePuzzle;
    }

    // -- board sizing --
    const boardDimTarget = Math.min(context.screen.pixel.width, context.screen.pixel.height);
    // squareDim = w/o it's borders!!! ...the margins between squares are pixels/borders
    const squareDim = Math.floor(((boardDimTarget - 1) / (3 * 3)) - 2);
    const subBoardDim = (squareDim + 1) * 3 + 1;
    const boardDim = (subBoardDim + 1) * 3 - 1;
    const boardOffsetX = Math.floor((context.screen.pixel.width - boardDim) / 2);
    const boardOffsetY = Math.floor((context.screen.pixel.height - boardDim) / 2);

    // -- game state --
    let pickerScope: Square | undefined = undefined;
    let pickerOffscreenPos: Vector | undefined = undefined;
    let puzzleIndexScope: number | undefined = undefined;

    // -- picker --
    const picker = new Picker(context, Math.round(squareDim * 1.3));

    const showGameWonPanel = (text: string) => {
        const message = xel.actors.fromText(context, text,
            {fgColor: 'negative'}, {});
        const stripe = new Actor({
            anchor: Vector.Zero,
            width: engine.drawWidth,
            height: message.height * 4,
            color: context.color.fg,
            pos: vec(0, engine.drawHeight / 2 - message.height * 2)
        });
        message.pos = vec(stripe.width / 2, stripe.height / 2);
        stripe.addChild(message);
        engine.add(stripe);
    };

    let enteredTime: number | undefined = undefined;
    engine.on('xelly:enter', () => {
        enteredTime = Date.now();
    });

    const showWinnerModal = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        showGameWonPanel(minutes > 0 ? `you won! (${minutes} minutes ${seconds} seconds)` : `you won! (${seconds} seconds)`);
    };

    picker.on('picker:select', (num: any) => {
        if (num === 10) {
            pickerScope!.clearUserValue();
            runtimeUserState[puzzleIndexScope!] = -1;
        } else {
            pickerScope!.setUserValue(num);
            runtimeUserState[puzzleIndexScope!] = num;
        }
        returnToBaseState();
        if (arrayEq(useSolution, runtimeUserState)) {
            const totalSeconds = Math.floor((Date.now() - enteredTime!) / 1000);
            showWinnerModal(totalSeconds);
            engine.emit('xelly:terminate', createTerminationResult(totalSeconds));
        }
    });

    const handleSquareClick = (square: Square, arrIndex: number) => {
        pickerScope = square;
        puzzleIndexScope = arrIndex;
        const margin = 5;
        const offScreenRight = engine.drawWidth < square.center.x + picker.width + margin;
        const offScreenBottom = engine.drawHeight < square.center.y + picker.height + margin;
        let pickerStartPos, pickerEndPos;
        if (offScreenRight && offScreenBottom) {
            pickerEndPos = square.center.add(vec(-picker.width, -picker.height));
            pickerStartPos = vec(pickerEndPos.x, engine.drawHeight);
        } else if (offScreenRight) {
            pickerEndPos = square.center.add(vec(-picker.width, 0));
            pickerStartPos = vec(engine.drawWidth, pickerEndPos.y);
        } else if (offScreenBottom) {
            pickerEndPos = square.center.add(vec(0, -picker.height));
            pickerStartPos = vec(pickerEndPos.x, engine.drawHeight);
        } else {
            pickerEndPos = square.center;
            if (pickerEndPos.y > engine.drawHeight / 2) {
                pickerStartPos = vec(pickerEndPos.x, engine.drawHeight);
            } else {
                pickerStartPos = vec(pickerEndPos.x, -picker.height);
            }
        }
        pickerEndPos = pickerEndPos.add(
            vec(Math.min(0, engine.drawWidth - (pickerEndPos.x + picker.width + margin)),
                Math.min(0, engine.drawHeight - (pickerEndPos.y + picker.height + margin))));
        pickerEndPos = vec(Math.max(margin, pickerEndPos.x), Math.max(margin, pickerEndPos.y));
        pickerOffscreenPos = pickerStartPos;
        picker.pos = pickerStartPos;
        picker.actions.moveTo({
            pos: pickerEndPos,
            duration: 150
        });
        engine.add(picker);
    };

    const returnToBaseState = () => {
        puzzleIndexScope = undefined;
        pickerScope = undefined;
        if (pickerOffscreenPos) {
            picker.actions.moveTo({
                pos: pickerOffscreenPos,
                duration: 150
            }).die(); // die removes picker after animation
            pickerOffscreenPos = undefined;
        } else {
            engine.remove(picker);
        }
    };

    picker.on('picker:cancel', () => {
        returnToBaseState();
    });

    engine.input.pointers.primary.on('down', () => {
        // assume this is the background -- all other handles should e.cancel()
        // before it reaches us...
        returnToBaseState();
    });

    // -- build the board --
    for (let i = 0; i < 3; ++i) { // region x
        for (let j = 0; j < 3; ++j) { // region y
            const subBoardOffsetX = boardOffsetX + i * (subBoardDim + 1);
            const subBoardOffsetY = boardOffsetY + j * (subBoardDim + 1);
            for (let k = 0; k < 3; ++k) { // inner x
                for (let m = 0; m < 3; ++m) { // inner y
                    const idx = (j * 3 + m) * 9 + i * 3 + k;
                    const square = new Square(context,
                        subBoardOffsetX + k * (squareDim + 1),
                        subBoardOffsetY + m * (squareDim + 1),
                        squareDim + 2/*border*/,
                        runtimeUserState[idx] > -1 ? runtimeUserState[idx] : undefined);
                    square.on('box:click', () => {
                        handleSquareClick(square, idx);
                    });
                    square.on('square:clickaway', () => {
                        returnToBaseState();
                    });
                    engine.add(square);
                }
            }
        }
    }

    engine.on('xelly:start', () => {
        if (userGameState) {
            showWinnerModal(userGameState.totalSeconds);
            engine.emit('xelly:terminate'); // !!! terminate WITHOUT state !!!
        }
    });
};
