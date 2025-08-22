import {Actor, EasingFunctions, Engine, vec, Vector,} from 'excalibur';
import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellySpriteActor
} from '@xelly/xelly.js';
import {SudokuCreator} from '@algorithm.ts/sudoku'

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
};

// ---

function arrayEq(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

/** Square. */
class Square extends XellySpriteActor {

    private readonly dim: number;
    private readonly pointerChild?: Actor;
    private valueChild?: Actor;

    constructor(context: XellyContext, pixelX: number, pixelY: number, dim: number, fixedValue?: number) {
        let mainSprite = xel.create.rect(0, 0, dim, dim);
        if (fixedValue !== undefined) {
            mainSprite = mainSprite.concat([[dim - 2, 1]]);
        }
        super(xel.actorArgs.fromPixelBasedArgs(context, {
            x: pixelX,
            y: pixelY,
            anchor: Vector.Zero,
        }), context, mainSprite);
        this.on('pointerdown', (e) => e.cancel());
        this.dim = dim;
        if (fixedValue !== undefined) {
            this.valueChild = this.createLabelEntity(fixedValue);
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

    createLabelEntity(val: number) {
        // todo do this w/ better lib support? eg, like Label (see hi-res)
        const labelSprite = xel.create.label(`${val}`);
        const [w, h] = [xel.sprites.width(labelSprite), xel.sprites.height(labelSprite)];
        const labelDimCss = vec(xel.convert.toCssScale(this.context, w),
            xel.convert.toCssScale(this.context, h));
        const squareDimCss = xel.convert.toCssScale(this.context, this.dim);
        return new XellySpriteActor({
                anchor: Vector.Zero,
                pos: vec((squareDimCss - labelDimCss.x) / 2, (squareDimCss - labelDimCss.y) / 2)
            }, this.context, labelSprite);
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


const picker2BlockDim = 10;
const picker2Margin = 2;
const picker2Hspacing = 2;
const picker2Vspacing = 2;
const picker2Width = 2 * picker2Margin + 3 * (picker2BlockDim + picker2Hspacing) - picker2Hspacing;
const picker2Height = 2 * picker2Margin + 4 * (picker2BlockDim + picker2Vspacing) - picker2Vspacing;

class Picker extends XellySpriteActor {

    constructor(context: XellyContext) {
        super({z: 1000}, context,
            xel.create.rect(0, 0, picker2Width, picker2Height),
            {bgAlpha: 0.9});
        this.on('pointerdown', (e) => {
            e.cancel();
        });
    }

    override onInitialize(engine: Engine): void {
        let currXOffset = - picker2Width / 2 + picker2Margin;
        let currYOffset = - picker2Height / 2 + picker2Margin;
        for (let i = 1; i < 11; ++i) {
            const block = new Actor(xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                pos: vec(currXOffset, currYOffset),
                width: picker2BlockDim,
                height: picker2BlockDim,
                z: 3000
            }));
            this.addChild(block);
            block.on('pointerdown', (e) => {
                this.emit('picker:select', i);
                e.cancel();
            });
            const label = new XellySpriteActor({
                    pos: vec(block.width / 2, block.height / 2),
                    z: 4000
                }, this.context,
                xel.create.label(`${i === 10 ? 'x' : i}`));
            block.addChild(label);
            currXOffset += picker2BlockDim + picker2Hspacing;
            if (i === 9) {
                currXOffset = -picker2Width / 2 + picker2Margin + picker2BlockDim + picker2Hspacing;
                currYOffset += picker2BlockDim + picker2Vspacing;
            } else if (i % 3 === 0) {
                currXOffset = -picker2Width / 2 + picker2Margin;
                currYOffset += picker2BlockDim + picker2Vspacing;
            }
        }
    }

}

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    // @see https://github.com/guanghechen/algorithm.ts/tree/@algorithm.ts/sudoku@4.0.2/packages/sudoku
    const creator = new SudokuCreator({ childMatrixWidth: 3 });
    const easy = creator.createSudoku(0.3);
    const puzzle = easy.puzzle.map(x => x < 0 ? x : x + 1);
    const solution = easy.solution.map(x => x < 0 ? x : x + 1);
    const userState: number[] = puzzle;

    // -- game state --
    let removedRegion: Actor | undefined = undefined;
    let pickerScope: Square | undefined = undefined;
    let puzzleIndexScope: number | undefined = undefined;

    // -- picker --
    const picker = new Picker(context);

    const createGameWonPanel = (text: string) => {
        return xel.actors.fromSprite(context,
            xel.create.label(text),
            {bgAlpha: 1, spritePadding: 10, borderWidth: 1, positioning: {anchor: Vector.Half, fractionalOffset: Vector.Half}},
            xel.actorArgs.fromPixelBasedArgs(context,
                {
                    anchor: Vector.Half,
                    pos: vec((context.screen.pixel.width / 2), context.screen.pixel.height / 2),
                    z: 100,
                }));
    }

    let enteredTime: number | undefined = undefined;
    engine.on('xelly:enter', () => enteredTime = Date.now());

    picker.on('picker:select', (num: any) => {
        if (num === 10) {
            pickerScope!.clearUserValue();
            userState[puzzleIndexScope!] = -1;
        } else {
            pickerScope!.setUserValue(num);
            userState[puzzleIndexScope!] = num;
        }
        returnToZoomedOutState();
        if (arrayEq(solution, userState)) {
            const totalSeconds = Math.floor((Date.now() - enteredTime!) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            engine.add(createGameWonPanel(minutes > 0 ? `you win!\n(${minutes} minutes\n${seconds} seconds)` : `you win!\n(${seconds} seconds)`));
            engine.emit('xelly:terminate');
        }
    });

    const origCameraPos = vec(engine.halfDrawWidth, engine.halfDrawHeight);

    const returnToZoomedOutState = () => {
        if (removedRegion !== undefined) {
            engine.add(removedRegion);
            removedRegion = undefined;
        }
        puzzleIndexScope = undefined;
        pickerScope = undefined;
        engine.remove(picker);
        return engine.currentScene.camera.zoomOverTime(1, 150, EasingFunctions.Linear)
            .then(() => {
                return engine.currentScene.camera.move(origCameraPos, 150, EasingFunctions.Linear);
            });
    };

    const handleRegionClick = (region: Actor, middle: boolean = false) => {
        removedRegion = region;
        engine.remove(removedRegion); // allows square clicks
        const zoom = 0.8 * Math.min(engine.drawHeight / region.height,
            engine.drawWidth / removedRegion.width);
        const regionCenter = removedRegion.center;
        engine.currentScene.camera.move(regionCenter, middle ? 0 : 100, EasingFunctions.Linear)
            .then(() => {
                engine.currentScene.camera.zoomOverTime(zoom, 150, EasingFunctions.Linear);
            });
    };

    const handleSquareClick = (square: Square, arrIndex: number) => {
        if (removedRegion !== undefined) { // pathology detect race by stalls
            engine.add(removedRegion);
            const picker2Pos = removedRegion!.center;
            removedRegion = undefined;
            pickerScope = square;
            puzzleIndexScope = arrIndex;
            const zoom = 0.8 * (engine.screen.viewport.height / picker.height);
            engine.currentScene.camera.zoomOverTime(zoom, 150, EasingFunctions.Linear);
            picker.pos = picker2Pos;
            picker.graphics.opacity = 0;
            picker.actions.fade(1, 250);
            engine.add(picker);
        }
    };

    engine.input.pointers.primary.on('down', () => {
        // assume this is the background -- all other handles should e.cancel()
        // before it reaches us...
        returnToZoomedOutState();
    });

    const boardDimTarget = Math.min(context.screen.pixel.width, context.screen.pixel.height);
    // squareDim = w/o it's borders!!! ...the margins between squares are pixels/borders
    const squareDim = Math.floor(((boardDimTarget - 1) / (3 * 3)) - 2);
    const subBoardDim = (squareDim + 1) * 3 + 1;
    const boardDim = (subBoardDim + 1) * 3 - 1;
    const boardOffsetX = Math.floor((context.screen.pixel.width - boardDim) / 2);
    const boardOffsetY = Math.floor((context.screen.pixel.height - boardDim) / 2);
    for (let i = 0; i < 3; ++i) { // region x
        for (let j = 0; j < 3; ++j) { // region y
            const subBoardOffsetX = boardOffsetX + i * (subBoardDim + 1);
            const subBoardOffsetY = boardOffsetY + j * (subBoardDim + 1);
            const region = new Actor(xel.actorArgs.fromPixelBasedArgs(context, {
                    anchor: Vector.Zero,
                    pos: vec(subBoardOffsetX, subBoardOffsetY),
                    width: subBoardDim,
                    height: subBoardDim,
                    z: 1000
                }));
            engine.add(region);
            region.on('pointerdown', (e) => {
                // note: condition here is safety - if there are race issues
                // we'll notice them by stalls
                if (removedRegion === undefined && pickerScope === undefined
                    && puzzleIndexScope === undefined) {
                    handleRegionClick(region, i === 1 && j === 1);
                } else {
                    returnToZoomedOutState();
                }
                e.cancel();
            })
            for (let k = 0; k < 3; ++k) { // inner x
                for (let m = 0; m < 3; ++m) { // inner y
                    const idx = (j * 3 + m) * 9 + i * 3 + k;
                    const square = new Square(context,
                        subBoardOffsetX + k * (squareDim + 1),
                        subBoardOffsetY + m * (squareDim + 1),
                        squareDim + 2/*border*/,
                        userState[idx] > -1 ? userState[idx] : undefined);
                    square.on('box:click', () => {
                        handleSquareClick(square, idx);
                    });
                    engine.add(square);
                }
            }
        }
    }
};
