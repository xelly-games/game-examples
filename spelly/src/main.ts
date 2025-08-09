import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme
} from '@xelly/xelly.js';
import {
    Actor,
    ActorArgs,
    Color,
    Engine,
    Font,
    FontUnit,
    GraphicsGroup,
    Label,
    Line,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import interWoff from './Inter.woff';
import {words} from './words';
import {allowed} from './words-allowed';
import {EvaluationResult, vibed_EvaluateSpelly} from './evaluate';

// we expect interWoff to be **inlined**
const interFontFace = new FontFace('Inter', `url(${interWoff})`);
// document.fonts.add(new FontFace('Inter', `url(${interWoff})`));

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased,
    replayable: true
};

// --

const modalFont = new Font({
    color: Color.White,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 18
});

// --

const createMatrix = (rows: number, cols: number) => {
    return Array.from({length: rows}, () => Array(cols).fill(null));
};

const createFont = (color: Color, sizePx: number, familyOverride?: string) => {
    return new Font({
        color,
        size: sizePx,
        family: familyOverride || 'Inter',
        unit: FontUnit.Px
    });
};

const createInvisibleBoundsRect = (width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        color: Color.Transparent,
        /*
        strokeColor: Color.Red,
        lineWidth: 1
         */
    });
};

const createFilledRect = (color: Color, width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        color: color
    });
};

const createOpenRect = (width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        lineWidth: 3,
        strokeColor: Color.LightGray,
        color: Color.Transparent
    });
};

const createMimimizerIcon = (width: number, height: number, strokeColor?: Color, invert?: boolean) => {
    if (invert) {
        const seg1 = new Line({start: vec(0, height), end: vec(Math.round(width / 2), 0), color: strokeColor || Color.Black, thickness: 2});
        const seg2 = new Line({start: vec(Math.round(width / 2), 0), end: vec(width, height), color: strokeColor || Color.Black, thickness: 2});
        return new GraphicsGroup({
            members: [seg1, seg2]
        });
    } else {
        const seg1 = new Line({start: vec(0, 0), end: vec(Math.round(width / 2), height), color: strokeColor || Color.Black, thickness: 2});
        const seg2 = new Line({start: vec(Math.round(width / 2), height), end: vec(width, 0), color: strokeColor || Color.Black, thickness: 2});
        return new GraphicsGroup({
            members: [seg1, seg2]
        });
    }
};

const createMinimizerGraphic = (width: number, height: number, topAndLeftMargins: Vector, invert?: boolean) => {
    const fill = createFilledRect(keyboardKeyColorFaded, width, height);
    const iconWidth = width * 0.6;
    const iconHeight = height * 0.4;
    const icon = createMimimizerIcon(iconWidth, iconHeight, Color.DarkGray, invert);
    return new GraphicsGroup({
        members: [
            {
                graphic: fill,
                offset: vec(topAndLeftMargins.x, topAndLeftMargins.y)
            },
            {
                graphic: icon,
                offset:
                    vec(Math.round((width - iconWidth) / 2) + topAndLeftMargins.x,
                        Math.round((height - iconHeight) / 2) + topAndLeftMargins.y)
            }
        ]
    });
};

const createDeleteGraphic = (width: number, height: number, strokeColor?: Color, strokeThickness?: number) => {
    const bodyRatio = 0.3;
    const contentRatio = 0.45;
    const useColor = strokeColor || Color.Black;
    const useStrokeThickness = strokeThickness || 2;
    const squarePartWidth = Math.round((1 - bodyRatio) * width);
    // -- body --
    const anchor0 = vec(0, Math.round(height / 2));
    const anchor1 = vec(Math.round(width * bodyRatio), 0);
    const anchor2 = vec(Math.round(width * bodyRatio), height);
    const seg1 = new Line({start: anchor0, end: anchor1, color: useColor, thickness: useStrokeThickness});
    const seg2 = new Line({start: anchor1, end: vec(width, 0), color: useColor, thickness: useStrokeThickness});
    const seg3 = new Line({start: vec(width, 0), end: vec(width, height), color: useColor, thickness: useStrokeThickness});
    const seg4 = new Line({start: vec(width, height), end: anchor2, color: useColor, thickness: useStrokeThickness});
    const seg5 = new Line({start: anchor2, end: anchor0, color: useColor, thickness: useStrokeThickness});
    // -- "x" --
    const xDim = Math.round(contentRatio * height);
    const xOffsetX = Math.round(((squarePartWidth - xDim) / 2) * 0.75/*fudge*/) + anchor1.x;
    const xAnchor0 = vec(xOffsetX, Math.round((height - xDim) / 2));
    const xAnchor1 = vec(xOffsetX + xDim, Math.round((height - xDim) / 2) + xDim);
    const xAnchor2 = vec(xAnchor1.x, xAnchor0.y);
    const xAnchor3 = vec(xAnchor0.x, xAnchor1.y);
    const seg6 = new Line({start: xAnchor0, end: xAnchor1, color: useColor, thickness: useStrokeThickness});
    const seg7 = new Line({start: xAnchor2, end: xAnchor3, color: useColor, thickness: useStrokeThickness});
    return new GraphicsGroup({
        members: [seg1, seg2, seg3, seg4, seg5, seg6, seg7]
    });
};

const createModal = (message: string, marginX: number = 15, marginY: number = 10) => {
    const m = modalFont.measureText(message);
    const modal = new Actor({
        anchor: Vector.Zero,
        width: m.width + marginX,
        height: m.height + marginY,
        color: new Color(10, 10, 10), // almost black
        z: 200
    });
    const label = new Label({
        text: message,
        font: modalFont,
        color: Color.White
    });
    modal.on('initialize', () => {
        label.anchor = Vector.Half;
        label.pos = vec(modal.width / 2, modal.height / 2);
        modal.addChild(label);
    });
    return modal;
};

const guessGridFontSize = 36;
const guessGridTopMargin = 5;
const guessGridSquareMargin = 3;
const guessGridOuterMargin = 5;
const guessGridMaxWidth = 300;
const guessGridMaxSquareDim
    = Math.round((guessGridMaxWidth + guessGridSquareMargin) / 5 - guessGridSquareMargin);

const keyboardWidthPercent = 0.90;
const keyboardKeyMargin = 2;
const keyboardHeightOverWidth = 1.2;
const keyboardBottomMargin = 10;
const keyLabelSizeOverKeyHeight = 0.6;
const keyboardOpacity = 0.5;
const keyboardKeyColor = new Color(211, 211, 211);
const keyboardKeyColorFaded = new Color(keyboardKeyColor.r, keyboardKeyColor.g, keyboardKeyColor.b, keyboardOpacity);
const keyboardMinimizerWidthOverKeyWidth = 0.6;
const keyboardMinimizerWidthOverHeight = 1.2;
const keyboardMinimizerMargin = 3;
const keyboardMinimizedPeekabooMargin = 25;

const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], // !!! logic will add <enter> and <delete> on both sides of last row !!!
];

const keyColorDark_original = Color.fromRGB(109, 113, 115);
const keyColorDarkFaded_original = Color.fromRGB(keyColorDark_original.r, keyColorDark_original.g, keyColorDark_original.b, keyboardOpacity);
const keyColorGreen_original = Color.fromRGB(98, 160, 88);
const keyColorGreenFaded_original = Color.fromRGB(keyColorGreen_original.r, keyColorGreen_original.g, keyColorGreen_original.b, keyboardOpacity);
const keyColorYellow_original = Color.fromRGB(193, 171, 77);
const keyColorYellowFaded_original = Color.fromRGB(keyColorYellow_original.r, keyColorYellow_original.g, keyColorYellow_original.b, keyboardOpacity);

const keyColorDark = Color.fromRGB(109, 113, 115);
const keyColorDarkFaded = Color.fromRGB(keyColorDark.r, keyColorDark.g, keyColorDark.b, keyboardOpacity);
const keyColorGreen = Color.fromRGB(37, 196, 123);
const keyColorGreenFaded = Color.fromRGB(keyColorGreen.r, keyColorGreen.g, keyColorGreen.b, keyboardOpacity);
const keyColorYellow = Color.fromRGB(252, 198, 0);
const keyColorYellowFaded = Color.fromRGB(keyColorYellow.r, keyColorYellow.g, keyColorYellow.b, keyboardOpacity);

type KeyboardOptions = {
    readonly transparent?: boolean;
    readonly minimizerInvisibleMargins?: Vector;
};

type KeyboardBounds = {
    readonly dimensions: { width: number, height: number };
    readonly localOffsetMinusControls: Vector;
};

/** Keyboard. */
class Keyboard extends Actor {

    private readonly options: KeyboardOptions;
    private keyboardBounds: KeyboardBounds | undefined;
    private minimized: boolean = false;
    private charToCurrentKeyColorBit = new Map<string, number>();

    constructor(config: ActorArgs & KeyboardOptions) {
        super(config);
        this.options = {transparent: false, minimizerInvisibleMargins: vec(10, 25), ...config};
    }

    onInitialize(engine: Engine) {
        super.onInitialize(engine);
        const maxKeyboardWidth = Math.round(engine.drawWidth * keyboardWidthPercent);
        const cols = Math.max(...keyboardKeys.map(row => row.length));
        const keyWidth = Math.floor((maxKeyboardWidth - cols * keyboardKeyMargin) / cols);
        const keyHeight = Math.round(keyboardHeightOverWidth * keyWidth);
        const font = createFont(Color.Black, Math.round(keyHeight * keyLabelSizeOverKeyHeight));
        const smallFont = createFont(Color.Black, font.size * 0.5);

        const minimizerWidth = keyboardMinimizerWidthOverKeyWidth * keyWidth;
        const minimizerHeight = minimizerWidth / keyboardMinimizerWidthOverHeight;
        // NOTE: headroom gives more but invisible "clickable"/"touchable" area for user minimize/maximize
        const minimizerInvisibleMargins = this.options.minimizerInvisibleMargins!;
        const minimizer = new Actor({
            anchor: Vector.Zero,
            pos: vec(maxKeyboardWidth - minimizerWidth - keyboardMinimizerMargin - minimizerInvisibleMargins.x, 0)
        });
        const minimize = createMinimizerGraphic(minimizerWidth, minimizerHeight, minimizerInvisibleMargins);
        const maximize = createMinimizerGraphic(minimizerWidth, minimizerHeight, minimizerInvisibleMargins, true);
        minimizer.graphics.add('minimize', minimize);
        minimizer.graphics.add('maximize', maximize);
        minimizer.graphics.use('minimize'); // for starters.
        minimizer.on('pointerdown', () => {
            this.emit('*minimize', {
                minimize: !this.minimized
            });
            minimizer.graphics.use(this.minimized ? 'minimize' : 'maximize');
            this.minimized = !this.minimized;
        });
        this.addChild(minimizer);

        const yOffsetBase = minimizerInvisibleMargins.y + minimizerHeight + keyboardMinimizerMargin;
        for (let row = 0; row < keyboardKeys.length; ++row) {
            const rowLen = keyboardKeys[row].length;
            const rowWidth = Keyboard.calculateRowWidth(keyWidth, rowLen);
            const xOffset = Math.floor((maxKeyboardWidth - rowWidth) / 2);
            const yOffset = yOffsetBase + row * (keyHeight + keyboardKeyMargin);
            for (let col = 0; col < keyboardKeys[row].length; ++col) {
                this.addChild(this.createKeyActor(font, keyboardKeys[row][col], keyWidth,
                    keyHeight, xOffset + col * (keyWidth + keyboardKeyMargin), yOffset));
            }
            if (row === keyboardKeys.length - 1) { // last row
                this.addChild(this.createKeyActor(smallFont, 'DEL', xOffset - keyboardKeyMargin,
                    keyHeight, 0, yOffset));
                this.addChild(this.createKeyActor(smallFont, 'ENTER', maxKeyboardWidth - (xOffset + rowWidth + keyboardKeyMargin * 2),
                    keyHeight, xOffset + rowWidth + keyboardKeyMargin * 2, yOffset));
            }
        }

        const dimensionsMinusControls = {
            width: Math.max(...keyboardKeys.map(row => Keyboard.calculateRowWidth(keyWidth, row.length))),
            height: Math.round(keyboardKeys.length * (keyHeight + keyboardKeyMargin) - keyboardKeyMargin)
        };
        const totalDimensions = {
            width: dimensionsMinusControls.width,
            height: dimensionsMinusControls.height + yOffsetBase
        };
        this.keyboardBounds = {
            dimensions: totalDimensions,
            localOffsetMinusControls: vec(0, yOffsetBase)
        };

        if (!this.options.transparent) {
            this.graphics.use(new GraphicsGroup({
                members: [{
                    graphic: createFilledRect(Color.White, dimensionsMinusControls.width, dimensionsMinusControls.height),
                    offset: vec(0, yOffsetBase)
                }]
            }));
        }
    }

    /** Available after class #onInitialize(). */
    getKeyboardBounds(): KeyboardBounds {
        if (!this.keyboardBounds) {
            throw new Error('keyboard bounds only available after onInitialize()');
        }
        return this.keyboardBounds!;
    }

    createKeyActor(font: Font, text: string, keyWidth: number, keyHeight: number, xOffset: number, yOffset: number) {
        const theKey = new Actor({
            name: `theKey${text}`, // see highlightKey() below.
            anchor: Vector.Zero,
            pos: vec(xOffset, yOffset),
            width: keyWidth,
            height: keyHeight,
            color: keyboardKeyColorFaded
        });
        if (text === 'DEL') {
            // SPECIAL CASE (note we don't need to ever color this key like we do with letters (see highlightKey())
            const label = new Actor({
                name: 'theKeyLabel'
            });
            const deleteGraphic = createDeleteGraphic(font.size * 1.4, font.size);
            label.graphics.use(deleteGraphic);
            label.anchor = Vector.Half;
            label.pos = vec(keyWidth / 2, keyHeight / 2);
            theKey.addChild(label);
        } else {
            const label = new Label({
                name: 'theKeyLabel',
                text: text,
                font: font,
                color: Color.Black
            });
            label.anchor = Vector.Half;
            label.pos = vec(keyWidth / 2, keyHeight / 2);
            theKey.addChild(label);
        }
        theKey.on('pointerdown', () => {
            if (!this.minimized) {
                this.emit('*keypress', text);
            }
        });
        return theKey;
    }

    static calculateRowWidth(keyWidth: number, rowLen: number) {
        return rowLen * (keyWidth + keyboardKeyMargin) - keyboardKeyMargin;
    }

    highlightKey(ch: string, bit: (0 | 1 | 2)) {
        const theKey =
            this.children.find(c => c.name === `theKey${ch}`);
        const currKeyColorBit = this.charToCurrentKeyColorBit.get(ch);
        if (currKeyColorBit !== undefined && currKeyColorBit <= bit) {
            return; // no need to update color -- e.g., if color is green we don't want to downgrade to yellow etc
        }
        if (theKey) {
            const theKeyLabel = theKey.children.find(c => c.name === 'theKeyLabel');
            if (theKeyLabel) {
                const asActor = (theKey as Actor);
                const asLabel = (theKeyLabel as Label); // only ever a Label/letter, i.e., never DEL or ENTER
                const filledRect
                    = createFilledRect(bit === 0 ? keyColorGreenFaded
                    : bit === 1 ? keyColorYellowFaded
                        : bit === 2 ? keyColorDarkFaded
                            : Color.Black, asActor.width, asActor.height);
                asActor.graphics.use(filledRect);
                asLabel.color = Color.White;
                this.charToCurrentKeyColorBit.set(ch, bit);
            }
        }
    }

}

/** Grid. */
class GuessGrid extends Actor {
    private font: Font | undefined;
    private readonly blocks: Actor[][];
    private currRow = 0;
    private currCol = 0;
    private working: string = ''; // letters
    private guessSquareDim: number | undefined;
    private readonly guesses: string[] = [];

    constructor(config: ActorArgs) {
        super(config);
        this.blocks = createMatrix(6, 5);
    }

    onInitialize(engine: Engine) {
        super.onInitialize(engine);
        this.guessSquareDim = Math.min(
            guessGridMaxSquareDim,
            Math.floor((engine.drawWidth - 4 * guessGridSquareMargin - 2 * guessGridOuterMargin) / 5/*!*/),
            Math.floor((engine.drawHeight - 5 * guessGridSquareMargin - 2 * guessGridOuterMargin) / 6/*!*/));
        for (let row = 0; row < 6; ++row) {
            for (let col = 0; col < 5; ++col) {
                const rect = createOpenRect(this.guessSquareDim);
                const block = new Actor();
                block.graphics.use(rect);
                block.anchor = Vector.Zero;
                block.pos = vec(col * (this.guessSquareDim + guessGridSquareMargin),
                    row * (this.guessSquareDim + guessGridSquareMargin));
                this.addChild(block);
                this.blocks[row][col] = block;
            }
        }
        const bounds = createInvisibleBoundsRect(
            5 * (this.guessSquareDim + guessGridSquareMargin) - guessGridSquareMargin,
            6 * (this.guessSquareDim + guessGridSquareMargin) - guessGridSquareMargin);
        this.graphics.add('bounds', bounds);
        this.graphics.use('bounds');
        this.font = createFont(Color.Black, guessGridFontSize);
    }

    currRowNum() {
        return this.currRow;
    }

    topRowBottomOffset() {
        return this.guessSquareDim!;
    }

    currentRowBottomOffset() {
        return this.currRow * (this.guessSquareDim! + guessGridSquareMargin) + this.guessSquareDim!;
    }

    bottomRowBottomOffset() {
        return 5 * (this.guessSquareDim! + guessGridSquareMargin) + this.guessSquareDim!;
    }

    pushLetter(letter: string) {
        if (this.currCol < 5) {
            const label = new Label({
                text: letter,
                font: this.font
            });
            this.working = this.working + letter;
            const block = this.blocks[this.currRow][this.currCol];
            this.currCol++;
            // note: setting anchor and pos AFTER construction so that it's bounds are
            //   computed given the font + text
            label.anchor = Vector.Half;
            label.pos = vec(this.guessSquareDim! / 2, this.guessSquareDim! / 2);
            block.addChild(label);
        }
    }

    popLetter() {
        if (this.currCol > 0) {
            this.working = this.working.slice(0, -1);
            this.blocks[this.currRow][--this.currCol].removeAllChildren();
        }
    }

    /** Returns non-undefined only if ready to commit. */
    fullWord() {
        return this.currCol === 5 ? this.working : undefined;
    }

    allGuesses() {
        return this.guesses;
    }

    /** Returns false on no more rows. */
    commitRow(evaluation: EvaluationResult, allowAnimation: boolean = false) {
        const candidate = this.fullWord();
        if (candidate) {
            const invertedFont = this.font!.clone();
            invertedFont.color = Color.White;
            for (let i = 0; i < 5; ++i) {
                const e = evaluation[i];
                const block = this.blocks[this.currRow][i];
                const filledRect
                    = createFilledRect(e === 0 ? keyColorGreen
                    : e === 1 ? keyColorYellow
                        : e === 2 ? keyColorDark
                            : Color.Black, this.guessSquareDim!);
                block.graphics.use(filledRect);
                block.removeAllChildren();
                const label = new Label({
                    text: candidate[i],
                    font: invertedFont
                });
                label.anchor = Vector.Half;
                label.pos = vec(this.guessSquareDim! / 2, this.guessSquareDim! / 2);
                block.addChild(label);
            }
            ++this.currRow;
            this.currCol = 0;
            this.guesses.push(candidate);
            this.working = '';
        }
        return this.currRow < 6;
    }

}

// -- context.parameters --

const readPuzzleWordFromContextConfig = (context: XellyContext) => {
    if (context.parameters?.gameConfig && context.parameters?.gameConfig.trim()) {
        // NOTE !!!
        //   (1) if we have a game config we are going to assume it provides us the static
        //       word to use -- this makes this game technically NON-replayable -- so we
        //       will insert this game into db with a parseable config and
        //       replayable = false.
        //   (2) for now we are going to let parsing fail-fast if the config is bad (non-json)
        //       and does not conform to the config we expect (i.e, has a word property w/ 5-letter
        //       value)
        const parsed = JSON.parse(context.parameters.gameConfig);
        if (typeof parsed.word === 'string' && /^[a-zA-Z]{5}$/.test(parsed.word)) {
            return parsed.word.toUpperCase();
        } else {
            throw new Error(`bad game config: ${context.parameters.gameConfig}`);
        }
    }
    return undefined;
};

type TerminationGameState = {
    guesses: string[]
};

const toTerminationResult = (grid: GuessGrid) => {
    const payload: TerminationGameState = {
        guesses: grid.allGuesses()
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

// CONSIDER: coloring keyboard for serialized win user game state
// CONSIDER: not hiding keyboard completely for winners, but just below last guessed row which could be 2, e.g.

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const useWord = readPuzzleWordFromContextConfig(context)
        || words[Math.floor(Math.random() * words.length)].toUpperCase();
    const userGameState = readGameStateFromContextParameters(context);

    let resolveStartedPromise: () => void;
    const startedPromise = new Promise<void>((res) => {
        resolveStartedPromise = res;
    });
    interFontFace.load().then((loaded) => {
        document.fonts.add(loaded);

        // -- modals --
        const illegalWordModal = createModal('Invalid guess');
        const answerWordModal = createModal(useWord);

        // we want to place modals so they overlap the guess grid blocks
        //   (makes them easier to see :)
        const firstRowModalOverlap = 3;
        const showLoserModal = () => {
            answerWordModal.anchor = Vector.Zero;
            answerWordModal.pos = vec((engine.drawWidth - answerWordModal.width) / 2,
                // assume we call showLoserModal when grid has been initialized and we
                //  can call grid.currRowBottomOffset()
                grid.topRowBottomOffset() - firstRowModalOverlap);
            engine.add(answerWordModal);
        };

        const showWinnerModal = (numGuesses: number) => {
            const winnerModal = createModal(`WINNER (${numGuesses} ${numGuesses === 1 ? 'guess' : 'guesses'})`);
            // assume we call showWinnerModal when grid has been initialized and we
            //  can call grid.currRowBottomOffset()
            const winnerModalOffsetY = grid.topRowBottomOffset() - firstRowModalOverlap;
            winnerModal.anchor = Vector.Zero;
            winnerModal.pos = vec((engine.drawWidth - winnerModal.width) / 2, winnerModalOffsetY);
            engine.add(winnerModal);
        };

        // -- grid --
        const grid = new GuessGrid({});
        grid.on('initialize', () => {
            grid.anchor = Vector.Zero;
            const gridDefaultXOffset
                = Math.round((engine.drawWidth - grid.graphics.localBounds.width) / 2);
            const gridDefaultYOffset = guessGridTopMargin;
            grid.pos = vec(gridDefaultXOffset, gridDefaultYOffset);

            // -- keyboard --
            const keyboard = new Keyboard({
                name: 'keyboard',
                z: 100
            });
            keyboard.on('initialize', () => {
                const keyboardDefaultXOffset
                    = Math.round((engine.drawWidth - keyboard.getKeyboardBounds().dimensions.width) / 2);
                const keyboardDefaultYOffset
                    = engine.drawHeight - keyboard.getKeyboardBounds().dimensions.height - keyboardBottomMargin;
                keyboard.anchor = Vector.Zero;
                keyboard.pos = vec(keyboardDefaultXOffset, keyboardDefaultYOffset);
                const maybeAnimateGridToAvoidOverlap = () => {
                    const defaultOverlap = (gridDefaultYOffset + grid.currentRowBottomOffset())
                        - (keyboardDefaultYOffset + keyboard.getKeyboardBounds()!.localOffsetMinusControls.y);
                    if (defaultOverlap > 0) {
                        grid.actions.moveTo({
                            pos: vec(gridDefaultXOffset, -defaultOverlap),
                            duration: 100
                        });
                    }
                };
                const dropKeyboardToJustBelowBottomRow = (onlyIfNeeded: boolean = true) => {
                    const keyboardOffsetThatIsJustBelow = gridDefaultYOffset + grid.bottomRowBottomOffset()
                        - keyboard.getKeyboardBounds()!.localOffsetMinusControls.y
                        + /*whatever:*/guessGridSquareMargin * 2;
                    keyboard.actions.moveTo({
                        pos: vec(keyboardDefaultXOffset,
                            onlyIfNeeded
                                ? Math.max(keyboardDefaultYOffset, keyboardOffsetThatIsJustBelow)
                                : keyboardOffsetThatIsJustBelow),
                        duration: 100
                    });
                };
                const minimizeKeyboard = (minimize: boolean, peekabooMargin: number = keyboardMinimizedPeekabooMargin) => {
                    keyboard.actions.moveTo({
                        pos: vec(keyboardDefaultXOffset,
                            minimize ? engine.drawHeight -
                                keyboard.getKeyboardBounds()!.localOffsetMinusControls.y - peekabooMargin
                                : keyboardDefaultYOffset),
                        duration: 100
                    });
                    if (minimize) {
                        // whenever we're minimized, animate grid back into default
                        //  position
                        grid.actions.moveTo({
                            pos: vec(gridDefaultXOffset, gridDefaultYOffset),
                            duration: 100
                        });
                    } else {
                        maybeAnimateGridToAvoidOverlap();
                    }
                };
                keyboard.on('*minimize', (e: any) => {
                    minimizeKeyboard(e.minimize);
                });
                keyboard.on('*keypress', (key: any) => {
                    switch (key) {
                        case 'ENTER':
                            const guess = grid.fullWord();
                            if (guess) {
                                const normalizedGuess = guess.toLowerCase();
                                if (words.includes(normalizedGuess)
                                    || allowed.includes(normalizedGuess)) { // todo animate/signal if not
                                    const evaluation = vibed_EvaluateSpelly(guess, useWord);
                                    const moreRows = grid.commitRow(evaluation, true);
                                    for (let i = 0; i < 5; ++i) {
                                        keyboard.highlightKey(guess[i], evaluation[i]);
                                    }
                                    if (guess === useWord) { // winner
                                        dropKeyboardToJustBelowBottomRow(true); // instead of: minimizeKeyboard(true, 0);
                                        showWinnerModal(grid.currRowNum());
                                        engine.emit('xelly:terminate', toTerminationResult(grid));
                                    } else if (moreRows) {
                                        maybeAnimateGridToAvoidOverlap();
                                    } else { // loser
                                        dropKeyboardToJustBelowBottomRow(true); // instead of: minimizeKeyboard(true, 0);
                                        showLoserModal();
                                        engine.emit('xelly:terminate', toTerminationResult(grid));
                                    }
                                } else {
                                    // illegal word!
                                    illegalWordModal.anchor = Vector.Zero;
                                    illegalWordModal.pos = vec((engine.drawWidth - illegalWordModal.width) / 2,
                                        grid.topRowBottomOffset() - firstRowModalOverlap);
                                    engine.add(illegalWordModal);
                                    const actionContext
                                        = illegalWordModal.actions.repeat((repeatContext) => {
                                        repeatContext.moveBy(3, 0, 25);
                                        repeatContext.moveBy(-3, 0, 25);
                                    }, 3);
                                    actionContext.delay(150);
                                    actionContext.callMethod(() => {
                                        engine.remove(illegalWordModal);
                                    });
                                }
                            }
                            break;
                        case 'DEL':
                            grid.popLetter();
                            break;
                        default:
                            grid.pushLetter(key);
                    }
                });
            });
            engine.add(keyboard);
        });
        engine.add(grid);
        // CONSIDER: lifecycle choice here and more efficiency of rehydration of game state
        startedPromise.then(() => {
            if (userGameState) {
                const restoreGameState = () => {
                    userGameState.guesses.forEach(guess => {
                        for (const ch of guess) {
                            grid.pushLetter(ch);
                        }
                        const evaluation = vibed_EvaluateSpelly(guess, useWord);
                        grid.commitRow(evaluation);
                    });
                    /*
                    const theKeyboard = engine.currentScene.actors.find(a => a.name === 'keyboard');
                    theKeyboard!.kill();
                     */
                    const lastGuess = userGameState.guesses[userGameState.guesses.length - 1];
                    if (lastGuess.toLowerCase() === useWord.toLowerCase()) {
                        showWinnerModal(userGameState.guesses.length);
                    } else {
                        showLoserModal();
                    }
                    engine.emit('xelly:terminate'); // !!! terminate WITHOUT state !!!
                };
                if (grid.isInitialized) {
                    restoreGameState();
                } else {
                    grid.on('initialize', () => {
                        restoreGameState();
                    });
                }
            }
        });
    });
    engine.on('xelly:start', () => {
        resolveStartedPromise?.();
    });
};
