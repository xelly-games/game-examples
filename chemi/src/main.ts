import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    ActionSequence,
    Actor,
    Color,
    Engine,
    Font,
    FontUnit,
    GraphicsGroup,
    ImageSource,
    InitializeEvent,
    Label,
    Line,
    ParallelActions,
    PointerEvent,
    Rectangle,
    Timer,
    vec,
    Vector
} from 'excalibur';
import {Progress} from './Progress';
import bottle from './bottle.png';

const bottleImage = new ImageSource(bottle);

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
};

// CONSIDER numBallsPerTube vs tubeCapacity

const useGameTimer = false;

const numTubes = 6;
const numBallsPerTube = 5;

const useBottleImage = true;

const tubeWidth = 40;
const tubeMargin = 12;

const cubeMarginX = 4;
const cubeMarginY = 1;
const cubeWidth = 32;

const bottomMargin = 25;
const progressBarWidth = 10;

const tubeHeight = cubeWidth * (numBallsPerTube + cubeMarginY);

const timeLimitSeconds = 60;

const moveable_ = (tubeState: Color[]) => {
    let index = tubeState.length - 1;
    while (index > 0 && tubeState[index].equal(tubeState[index - 1])) {
        index--;
    }
    return tubeState.length - index;
}

const shuffle_ = (state: Color[][], times: number = 1) => {
    for (let i = 0; i < times; ++i) {
        const fromTubeIndex = Math.floor(Math.random() * numTubes);
        for (let j = 0; j < numTubes; ++j) {
            const useFromTubeIndex = (j + fromTubeIndex) % numTubes;
            const moveable = moveable_(state[useFromTubeIndex]);
            if (moveable > 0) {
                const toTubeIndex = Math.floor(Math.random() * numTubes);
                for (let k = 0; k < numTubes; ++k) {
                    const useToTubeIndex = (k + toTubeIndex) % numTubes;
                    if (useToTubeIndex !== fromTubeIndex) {
                        const availSpace = numBallsPerTube - state[useToTubeIndex].length;
                        if (availSpace > 0) {
                            const numToMove
                                = Math.floor(Math.random() * Math.min(availSpace, moveable) + 1);
                            for (let l = 0; l < numToMove; ++l) {
                                state[useToTubeIndex].push(state[useFromTubeIndex].pop()!);
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }
    }
};

const isWinning = (state: Color[][])=> {
    return state.every((tube) => {
        return tube.length === 0 || (tube.length === numBallsPerTube && tube.every(ball => ball.equal(tube[0])));
    });
};

// --

const jiggle = (blocks: Actor[][]) => {
    let promises = [];
    for (let i = 0; i < blocks.length; ++i) {
        for (let j = 0; j < blocks[i].length; ++j) {
            const block = blocks[i][j];
            if (block) {
                const originalPos = block.pos;
                const mot = new ActionSequence(block, ctx => {
                    ctx.repeat(ctx => {
                        const signX = Math.random() > 0.5 ? 1 : -1;
                        const signY = Math.random() > 0.5 ? 1 : -1;
                        const deltaX = Math.random() * 8;
                        const deltaY = Math.random() * 8;
                        return ctx.moveBy({
                            offset: vec(signX * deltaX, signY * deltaY),
                            duration: 50
                        }).moveBy({
                            offset: vec(signX * -deltaX, signY * -deltaY),
                            duration: 50
                        });
                    }, 2);
                });
                const p = new ParallelActions([mot]);
                const prom = block.actions.runAction(p).toPromise().then(() => {
                    return block.actions.moveTo({
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

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const progressBarColor = Color.LightGray; // context.color.fg
    const progress = new Actor({
        anchor: Vector.Zero,
        pos: vec(0, engine.drawHeight - (bottomMargin / 2) - (progressBarWidth / 2))
    });
    progress.graphics.use(new Progress({
        width: engine.drawWidth,
        lineWidth: progressBarWidth,
        strokeColor: progressBarColor,
        lineDash: [10, 2]
    }));
    const timer = new Timer({
        action: () => {
            const remainingTimeMs = (timeLimitSeconds * 1000) - timer.getTimeRunning();
            progress.graphics.use(new Progress({
                width: Math.max(0, (remainingTimeMs / (timeLimitSeconds * 1000)) * engine.drawWidth),
                lineWidth: progressBarWidth,
                strokeColor: progressBarColor,
                lineDash: [10, 1]
            }));
            if (remainingTimeMs < 0) {
                timer.stop();
                engine.add(createModal('you ran out of time :(', Color.Black));
                jiggle(blocks).then(() => {
                    engine.emit('xelly:terminate');
                });
            }
        },
        interval: 1000,
        repeats: true
    });

    let enteredTime: number | undefined = undefined;
    engine.on('xelly:enter', () => {
        enteredTime = Date.now();
    });

    if (useGameTimer) {
        engine.add(progress);
        engine.add(timer);
        engine.on('xelly:enter', () => {
            bottleImageLoadProm.then(() => {
                timer.start();
            });
        });
    }

    const state =
        [
            Array.from({length: numBallsPerTube}, () => Color.Rose),
            Array.from({length: numBallsPerTube}, () => Color.Azure),
            Array.from({length: numBallsPerTube}, () => Color.Green),
            Array.from({length: numBallsPerTube}, () => Color.Purple),
            Array.from({length: numBallsPerTube}, () => Color.Orange),
            []
        ];
    const blocks: Actor[][] = Array.from({length: numTubes}, () => []);

    type HoveringState = {
        tubeIndex: number,
        blockIndex: number,
        blockCount: number,
        color: Color
    };

    type BlockState = { tubeIndex: number, blockIndex: number };
    const blockToBlockState = new Map<Actor, BlockState>();

    let hoveringState: HoveringState | undefined = undefined;

    const totalWidth = tubeWidth * numTubes + tubeMargin * (numTubes - 1);
    const startXOffset = (engine.screen.drawWidth - totalWidth) / 2;
    // const yOffset = (engine.screen.drawHeight - tubeHeight) / 2;
    const yOffset = (engine.screen.drawHeight - tubeHeight - bottomMargin);
    const cubeInTubeDefaultPos = (tubeIndex: number, cubeIndex: number) => {
        return vec(startXOffset + (useBottleImage ? cubeMarginX : (cubeMarginX / 2)) + (tubeWidth + tubeMargin) * tubeIndex,
            yOffset + tubeHeight - (useBottleImage ? 10 : 5) - (cubeWidth + cubeMarginY) * (cubeIndex + 1));
    };
    const isTubeFullOfSame_ = (tubeIndex: number) => {
        return blocks[tubeIndex].length === numBallsPerTube &&
            state[tubeIndex].every(c => c.equal(state[tubeIndex][0]));
    }
    const tryHover_ = (tubeIndex: number) => {
        if (blocks[tubeIndex].length === 0 || hoveringState !== undefined) {
            return; // safety
        }
        const block = blocks[tubeIndex][blocks[tubeIndex].length - 1];
        const {blockIndex} = blockToBlockState.get(block)!;
        let startBlockIndex = blockIndex;
        while (startBlockIndex > 0 && state[tubeIndex][startBlockIndex - 1].equal(state[tubeIndex][blockIndex])) {
            startBlockIndex--;
        }
        let endBlockIndexExclusive = startBlockIndex;
        while (endBlockIndexExclusive < state[tubeIndex].length && state[tubeIndex][endBlockIndexExclusive].equal(state[tubeIndex][blockIndex])) {
            endBlockIndexExclusive++;
        }
        if (endBlockIndexExclusive === state[tubeIndex].length) {
            const blockCount = endBlockIndexExclusive - startBlockIndex;
            for (let i = 0; i < blockCount; ++i) {
                const hoveringPos = vec(block.pos.x,
                    yOffset - (i + 1) * (cubeWidth + cubeMarginY) - (useBottleImage ? 5 : 0));
                blocks[tubeIndex][i + startBlockIndex].actions.moveTo({
                    pos: hoveringPos,
                    duration: 75
                });
            }
            hoveringState = {
                tubeIndex,
                blockIndex: startBlockIndex,
                blockCount,
                color: state[tubeIndex][blockIndex]
            };
        }
    };
    const unhover_ = () => {
        if (hoveringState === undefined) {
            return; // safety.
        }
        // un-hover
        for (let i = 0; i < hoveringState!.blockCount; ++i) {
            blocks[hoveringState!.tubeIndex][i + hoveringState!.blockIndex].actions.moveTo({
                pos: cubeInTubeDefaultPos(
                    hoveringState!.tubeIndex,
                    i + hoveringState!.blockIndex),
                duration: 75
            });
        }
        hoveringState = undefined;
    };
    const handleWinState_ = () => {
        if (isWinning(state)) {
            timer.stop();
            if (useGameTimer) {
                engine.add(createModal('you won!', Color.Black));
            } else {
                const totalSeconds = Math.floor((Date.now() - enteredTime!) / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                const secondsText = seconds >= 1 ? 'seconds' : 'second';
                const minutesText = minutes >= 1 ? 'minutes' : 'minute';
                engine.add(createModal(minutes > 0 ?
                    `you won in ${minutes} ${minutesText}, ${seconds} ${secondsText}!` : `you won in ${seconds} ${secondsText}!`, Color.Black));
            }
            jiggle(blocks).then(() => {
                engine.emit('xelly:terminate');
            });
        }
    };
    const bottleImageLoadProm = bottleImage.load();
    bottleImageLoadProm.then(() => {
        const bottleSprite = bottleImage.toSprite();
        for (let i = 0; i < numTubes; ++i) {
            const tube = new Actor({
                anchor: Vector.Zero,
                pos: vec(startXOffset + i * (tubeWidth + tubeMargin), yOffset),
                ...(useBottleImage ? {scale: vec(0.22, 0.24)} : {}),
                z: 100
            });
            const thickness = 4;
            const color = Color.LightGray;
            tube.graphics.add('poly', new GraphicsGroup({
                members: [
                    new Line({
                        start: vec(0, 0),
                        end: vec(0, tubeHeight + thickness / 2),
                        color,
                        thickness
                    }),
                    new Line({
                        start: vec(0, tubeHeight),
                        end: vec(tubeWidth, tubeHeight),
                        color,
                        thickness
                    }),
                    new Line({
                        start: vec(tubeWidth, tubeHeight + thickness / 2),
                        end: vec(tubeWidth, 0),
                        color,
                        thickness
                    })]
            }));
            tube.graphics.add('rect', new Rectangle({
                width: tubeWidth,
                height: tubeHeight,
                color: Color.Transparent,
                strokeColor: Color.Black,
                lineWidth: 10
            }));
            if (useBottleImage) {
                tube.graphics.use(bottleSprite); // see Actor.scale ^^
            } else {
                tube.graphics.use('poly');
                //tube.graphics.use('rect');
            }
            const thisTubeIndex = i;
            tube.on('pointerdown', e => {
                if (hoveringState === undefined) {
                    e.cancel(); // whenever we handle don't allow propogate
                    if (isTubeFullOfSame_(thisTubeIndex)) {
                        // animate up, yank it back
                        Promise.all(blocks[thisTubeIndex].map(block => {
                            return block.actions.moveTo({
                                pos: vec(block.pos.x, block.pos.y - cubeWidth * 2),
                                duration: 75
                            }).toPromise();
                        })).then(() => {
                            return Promise.all(blocks[thisTubeIndex].map((block, idx) => {
                                const finalPos = cubeInTubeDefaultPos(thisTubeIndex, idx);
                                return block.actions.moveTo({
                                    pos: finalPos,
                                    duration: 75
                                }).toPromise();
                            }));
                        });
                    } else {
                        tryHover_(thisTubeIndex);
                    }
                    return;
                }
                // assert: hoveringState !== undefined
                if (thisTubeIndex === hoveringState.tubeIndex) {
                    e.cancel(); // whenever we handle don't allow propogate
                    // clicked on same tube as hovering
                    unhover_();
                } else {// assert: hoveringState !== undefined
                    const capacity = numBallsPerTube - blocks[thisTubeIndex].length;
                    const canFit = capacity >= hoveringState.blockCount;
                    if (!canFit) {
                        unhover_();
                    } else {
                        // we are good to go!
                        e.cancel(); // whenever we handle don't allow propogate
                        const proms = [];
                        const goToX = cubeInTubeDefaultPos(thisTubeIndex, 0/*no matter*/).x;
                        for (let i = 0; i < hoveringState.blockCount; ++i) {
                            const block = blocks[hoveringState.tubeIndex][hoveringState.blockIndex + i];
                            const nextPos = vec(goToX, block.pos.y);
                            proms.push(block.actions.moveTo({
                                pos: nextPos,
                                duration: 75
                            }).toPromise());
                        }
                        Promise.all(proms).then(() => {
                            for (let i = 0; i < hoveringState!.blockCount; ++i) {
                                const block = blocks[hoveringState!.tubeIndex][hoveringState!.blockIndex + i];
                                const finalPos = cubeInTubeDefaultPos(thisTubeIndex, blocks[thisTubeIndex].length + i);
                                proms.push(block.actions.moveTo({
                                    pos: finalPos,
                                    duration: 75
                                }).toPromise());
                            }
                        });
                        Promise.all(proms).then(() => {
                            blocks[thisTubeIndex].push(...blocks[hoveringState!.tubeIndex].splice(-hoveringState!.blockCount, hoveringState!.blockCount));
                            for (let i = 0; i < blocks.length; ++i) {
                                blockToBlockState.set(blocks[thisTubeIndex][i], {
                                    blockIndex: i,
                                    tubeIndex: thisTubeIndex
                                });
                            }
                            state[thisTubeIndex].push(...state[hoveringState!.tubeIndex].splice(-hoveringState!.blockCount, hoveringState!.blockCount));
                            hoveringState = undefined;
                            handleWinState_();
                        });
                    }
                }
            });
            engine.add(tube);
        }
        const handleBlockTap_ = (e: PointerEvent, block: Actor) => {
            const {
                tubeIndex,
                blockIndex
            } = blockToBlockState.get(block)!;
            if (hoveringState === undefined) { // move to hover
                // actually this will be covered by tube click
                // e.cancel(); // whenever we handle don't allow propogate
                // hover_(tubeIndex);
            } else if (tubeIndex === hoveringState.tubeIndex
                && blockIndex >= hoveringState.blockIndex
                && blockIndex < (hoveringState.blockIndex + hoveringState.blockCount)) {
                // NOTE: tube click handler will take care of this actually
                e.cancel(); // whenever we handle don't allow propogate
                unhover_();
            }
        };
        const drawBlocks_ = () => {
            for (let i = 0; i < numTubes; ++i) {
                for (let j = 0; j < numBallsPerTube; ++j) {
                    if (j < state[i].length) {
                        const finalPos = cubeInTubeDefaultPos(i, j);
                        const block = new Actor({
                            radius: cubeWidth / 2,
                            color: state[i][j],
                            anchor: Vector.Zero,
                            pos: vec(finalPos.x, -cubeWidth),
                            z: 50
                        });
                        blocks[i].push(block);
                        blockToBlockState.set(block, {
                            tubeIndex: i,
                            blockIndex: j
                        });
                        block.on('pointerdown', (e) => {
                            handleBlockTap_(e, block);
                        });
                        engine.add(block);
                        block.actions.moveTo({
                            pos: finalPos,
                            duration: 125
                        });
                    }
                }
            }
        };
        /*
        let i = 0;
        const iid = setInterval(() => {
            shuffle_(state);
            blocks.forEach(tube => {
                tube.forEach(block => {
                    block.kill();
                })
                tube.length = 0;
            });
            blockToBlockState.clear();
            drawBlocks_();
            if (++i > 25) {
                clearInterval(iid);
            }
        }, 1000);
         */
        shuffle_(state, 1000);
        drawBlocks_();
    });
};
