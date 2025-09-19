import {
    Actor,
    Color,
    Engine,
    Font,
    FontUnit,
    ImageSource,
    Label,
    Line,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {SudokuCreator} from '@algorithm.ts/sudoku';
import {createUndoGraphicalButton} from './undo';
// import editPenGreen from './edit-pen-green.svg';
import editPenBlue from './edit-pen-blue.svg';
// import editPenYellow from './edit-pen-yellow.svg';
import editPenRed from './edit-pen-red.svg';
import editPenGray from './edit-pen-gray.svg';
import undoSvg from './undo.svg';
import undoWhiteSvg from './undo-white.svg';

// ---
const undoImageSource = new ImageSource(undoSvg);
const undoWhiteImageSource = new ImageSource(undoWhiteSvg);

// ---
// const editPenGreenImage = new ImageSource(editPenGreen);
const editPenBlueImage = new ImageSource(editPenBlue);
// const editPenYellowImage = new ImageSource(editPenYellow);
const editPenRedImage = new ImageSource(editPenRed);
const editPenGrayImage = new ImageSource(editPenGray);

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
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
class Square extends Actor {

    private readonly dim: number;
    private readonly pointerChild?: Actor;
    valueChild?: Actor;
    dynamicValue?: number;
    readonly fixedValue?: number;

    constructor(x: number, y: number, dim: number, fixedValue?: number) {
        super({
            anchor: Vector.Zero,
            x: x,
            y: y
        });
        this.graphics.use(new Rectangle({
            width: dim,
            height: dim,
            color: Color.Transparent
        }));
        this.on('pointerdown', (e) => {
            this.emit('square:clickaway');
            e.cancel();
        });
        this.dim = dim;
        this.fixedValue = fixedValue;
        if (fixedValue !== undefined) {
            this.valueChild = this.createLabelEntity(fixedValue, true, Color.Black);
            this.addChild(this.valueChild);
        } else {
            // the invisible clickable entity:
            this.pointerChild = this.pointerChild = new Actor({
                anchor: Vector.Zero,
                offset: vec(1, 1),
                width: dim - 2,
                height: dim - 2,
                z: 1
            });
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

    createLabelEntity(val: number, fixed: boolean, color: Color): Actor {
        const squareDimCss = this.dim;
        const font = createFont(fixed ? Color.Black : color,
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
        this.setUserValue(undefined, Color.Black/*unused*/);
        this.dynamicValue = undefined;
    }

    setUserValue(val: number | undefined, color: Color) {
        if (this.valueChild) {
            this.removeChild(this.valueChild);
            this.valueChild = undefined;
        }
        if (val !== undefined) {
            this.valueChild = this.createLabelEntity(val, false, color);
            this.addChild(this.valueChild);
            this.dynamicValue = val;
        }
    }

}

const PickerMargin = 15;

const createOpenRect = (
    width: number, height?: number, color: Color = Color.LightGray, lineWidth: number = 2) => {
    return new Rectangle({
        width: width,
        height: height || width,
        lineWidth: lineWidth,
        strokeColor: color,
        color: Color.Transparent
    });
};

class Picker extends Actor {

    private readonly squareDim: number;
    private penColor: Color = Color.Black;
    private border!: Actor;

    constructor(squareDim: number, initialPenColor: Color) {
        super({
            z: 1000, anchor: Vector.Zero,
            width: PickerMargin * 2 + squareDim * 3,
            height: PickerMargin * 2 + squareDim * 4,
            color: Color.fromRGB(255, 255, 255, 0.95)
        });
        this.penColor = initialPenColor
        this.squareDim = squareDim;
        this.addBorder(initialPenColor);
        this.on('pointerdown', (e) => {
            this.emit('picker:cancel');
            e.cancel();
        });
    }

    override onInitialize(engine: Engine): void {
        this.reinitialize();
    }

    addBorder(color: Color) {
        const openRect = createOpenRect(
            PickerMargin * 2 + this.squareDim * 3,
            PickerMargin * 2 + this.squareDim * 4,
            color,
            6/**/);
        this.border = new Actor({
            z: 1001, anchor: Vector.Zero,
        });
        this.border.graphics.use(openRect);
        this.addChild(this.border);
    }

    updatePenColor(color: Color) {
        this.penColor = color;
        this.removeAllChildren();
        this.addBorder(color);
        this.reinitialize();
    }

    reinitialize() {
        const pickerMarginCss = PickerMargin;
        for (let i = 1; i < 11; ++i) {
            const row = Math.floor((i - 1) / 3);
            let col = (i - 1) % 3;
            if (i === 10) {
                col++;
            }
            const squareDimCss = this.squareDim;
            const font = createFont(this.penColor, Math.round(squareDimCss * 0.8)/*, 'monospace'*/);
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
                color: Color.Transparent,
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

const defaultThemeColor = Color.Black;

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
        const creator = new SudokuCreator({childMatrixWidth: 3});
        const medium = creator.createSudoku(0.6);
        const puzzle = medium.puzzle.map(x => x < 0 ? x : x + 1);
        const solution = medium.solution.map(x => x < 0 ? x : x + 1);
        usePuzzle = puzzle;
        useSolution = solution;
    }

    //const penColorYellow = Color.fromHex('#FCE883');
    const penColorRed = Color.fromHex('#EE204D');
    const penColorBlue = Color.fromHex('#1F75FE');
    //const penColorGreen = Color.fromHex('#1CAC78');
    const penColorGray = Color.fromHex('#95918C');
    let currentPenColor = penColorBlue; // starting color

    let runtimeUserState: number[];
    if (userGameState) {
        runtimeUserState = useSolution;
    } else {
        runtimeUserState = usePuzzle;
    }

    // -- board sizing --
    const boardDimTarget = Math.min(engine.drawWidth, engine.drawHeight);
    // squareDim = w/o it's borders!!! ...the margins between squares are pixels/borders
    const squareDim = Math.floor(((boardDimTarget - 1) / (3 * 3)) - 2);
    const subBoardDim = (squareDim + 1) * 3 + 1;
    const boardDim = (subBoardDim + 1) * 3 - 1;
    const boardOffsetX = Math.floor((engine.drawWidth - boardDim) / 2);
    const boardOffsetY = Math.floor((engine.drawHeight - boardDim) / 2);

    // -- game state --
    let pickerScope: Square | undefined = undefined;
    let pickerOffscreenPos: Vector | undefined = undefined;
    let puzzleIndexScope: number | undefined = undefined;

    // -- squares --
    const squares: Square[] = [];

    // -- picker --
    const picker = new Picker(Math.round(squareDim * 1.3), currentPenColor);

    const showGameWonPanel = (text: string) => {
        const message = new Actor();
        message.graphics.use(xel.graphics.fromSpriteArray(xel.create.label(text),
            {color: Color.White}));
        const stripe = new Actor({
            anchor: Vector.Zero,
            width: engine.drawWidth,
            height: message.height * 4,
            color: defaultThemeColor,
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

    type UndoItem = { index: number, square: Square };
    const undoStack: UndoItem[] = [];

    picker.on('picker:select', (num: any) => {
        if (num === 10) {
            pickerScope!.clearUserValue();
            runtimeUserState[puzzleIndexScope!] = -1;
        } else {
            pickerScope!.setUserValue(num, currentPenColor);
            runtimeUserState[puzzleIndexScope!] = num;
            undoStack.splice(0, undoStack.length, ...undoStack.filter(item => item.index !== puzzleIndexScope!));
            undoStack.push({ index: puzzleIndexScope!, square: pickerScope! });
        }
        returnToBaseState();
        if (arrayEq(useSolution, runtimeUserState)) { // win!
            const totalSeconds = Math.floor((Date.now() - enteredTime!) / 1000);
            const proms: Promise<any>[] = [];
            squares.forEach(sq => {
                if (sq.fixedValue === undefined) {
                    proms.push(sq.valueChild!.actions.blink(150, 150, 2).toPromise());
                }
            });
            Promise.all(proms).then(() => {
                showWinnerModal(totalSeconds);
                engine.emit('xelly:terminate', createTerminationResult(totalSeconds));
            });
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
            const regionOutline = new Actor({
                anchor: Vector.Zero,
                x: subBoardOffsetX,
                y: subBoardOffsetY
            });
            regionOutline.graphics.use(new Rectangle({
                width: 3 * (squareDim + 1),
                height: 3 * (squareDim + 1),
                lineWidth: 4,
                color: Color.Transparent,
                strokeColor: Color.LightGray
            }));
            engine.add(regionOutline);
            for (let k = 0; k < 3; ++k) { // inner x
                if (k > 0) {
                    const verticalLine = new Actor({
                        anchor: Vector.Zero,
                        x: subBoardOffsetX + k * (squareDim + 1),
                        y: subBoardOffsetY
                    });
                    verticalLine.graphics.use(new Line({
                        start: vec(0, 0),
                        end: vec(0, 3 * (squareDim + 1)),
                        thickness: 1,
                        color: Color.LightGray
                    }));
                    engine.add(verticalLine);
                }
                for (let m = 0; m < 3; ++m) { // inner y
                    if (k == 0 && m > 0) {
                        const horizontalLine = new Actor({
                            anchor: Vector.Zero,
                            x: subBoardOffsetX,
                            y: subBoardOffsetY + m * (squareDim + 1)
                        });
                        horizontalLine.graphics.use(new Line({
                            start: vec(0, 0),
                            end: vec(3 * (squareDim + 1), 0),
                            thickness: 1,
                            color: Color.LightGray
                        }));
                        engine.add(horizontalLine);
                    }
                    const idx = (j * 3 + m) * 9 + i * 3 + k;
                    const square = new Square(
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
                    squares[idx] = square;
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

    const editPenItselfTargetDim = 25;
    const editPenMarginX = 10;
    const editPenMarginY = 5;
    const editPenPadding = 3;
    const penImages = [
        {image: editPenBlueImage, color: penColorBlue},
        {image: editPenRedImage, color: penColorRed},
        //{ image: editPenGreenImage, color: penColorGreen },
        //{ image: editPenYellowImage, color: penColorYellow },
        {image: editPenGrayImage, color: penColorGray},
    ];
    let allPenOuters: Actor[] = [];
    Promise.all([
        undoWhiteImageSource.load(),
        undoImageSource.load(),
        //editPenGreenImage.load(),
        editPenRedImage.load(),
        //editPenYellowImage.load(),
        editPenBlueImage.load(),
        editPenGrayImage.load()]).then(() => {
        // -- undo
        const undoButton = createUndoGraphicalButton(engine, undoImageSource, undoWhiteImageSource);
        undoButton.on('press*', () => {
            const popped = undoStack.pop();
            if (popped) {
                popped.square.clearUserValue();
                runtimeUserState[popped.index] = -1;
            }
        });
        engine.add(undoButton);
        // -- pens
        let yOffset = editPenMarginY;
        for (let penImage of penImages) {
            const penOuter = new Actor({
                anchor: Vector.Zero,
                pos: vec(engine.drawWidth - editPenMarginX - editPenItselfTargetDim - editPenPadding, yOffset),
            });
            penOuter.graphics.add('boxed*', createOpenRect(
                editPenItselfTargetDim + 2 * editPenPadding,
                editPenItselfTargetDim + 2 * editPenPadding,
            ));
            // we create default (transparent) rect too so we're clickable
            penOuter.graphics.add(createOpenRect(
                editPenItselfTargetDim + 2 * editPenPadding,
                editPenItselfTargetDim + 2 * editPenPadding,
                Color.Transparent
            ));
            if (penImage.color === currentPenColor) {
                penOuter.graphics.use('boxed*');
            } else {
                penOuter.graphics.use('default');
            }
            const penItself = new Actor({
                anchor: Vector.Zero,
                pos: vec(editPenPadding, editPenPadding),
                scale: vec(editPenItselfTargetDim / penImage.image.width,
                    editPenItselfTargetDim / penImage.image.width),
            });
            penItself.graphics.use(penImage.image.toSprite());
            penOuter.addChild(penItself);
            penOuter.on('pointerdown', (e) => {
                currentPenColor = penImage.color;
                picker.updatePenColor(penImage.color);
                for (let item of allPenOuters) {
                    item.graphics.use('default');
                }
                penOuter.graphics.use('boxed*');
                e.cancel();
            });
            allPenOuters.push(penOuter);
            engine.add(penOuter);
            yOffset += editPenItselfTargetDim + editPenMarginY + editPenPadding;
        }
    });
};
