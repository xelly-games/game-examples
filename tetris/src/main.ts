import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme
} from '@xelly/xelly.js';
import {Actor, Color, Engine, Timer, vec, Vector} from 'excalibur';
import {Grid} from './grid';
import {Config} from './constants';
import {createMoveArrowButton, createRotateButton} from './buttons';
import {
    spawnFirstPieceAndInitState,
    State,
    tick,
    toLevel,
    tryMove,
    tryRotate
} from './state';
import {installSwipeDownHandler_} from './swipe';
import {installTitle} from './title';
import {Score} from './score';
import {NextPiece} from './next-piece';

export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime
};

const showGameOverPanel = (engine: Engine, themeColor: Color, text: string) => {
    const message = new Actor();
    const messageGraphic
        = xel.graphics.fromSpriteArray(xel.create.label(text),
        {color: Color.White, pixelScheme: XellyPixelScheme.Px3_1});
    message.graphics.use(messageGraphic);
    const stripe = new Actor({
        anchor: Vector.Zero,
        width: engine.drawWidth,
        height: Math.round(messageGraphic.height * 1.5),
        color: themeColor,
        pos: vec(0, engine.drawHeight / 2 - messageGraphic.height * 2)
    });
    message.pos = vec(stripe.width / 2, stripe.height / 2);
    stripe.addChild(message);
    engine.add(stripe);
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const themeColor = context.color.fg;

    // --
    const rotateLeft = createRotateButton(themeColor, 'left');
    const rotateRight = createRotateButton(themeColor, 'right');

    // --
    const grid = new Grid(themeColor, vec(
        engine.drawWidth - Config.MinGridMargin * 2,
        engine.drawHeight - Config.MinGridMargin * 2
        - (rotateLeft.graphics.current!.height
            - Config.RotateButtonInvisiblePadding.y)));
    grid.pos = vec(
        Math.floor((engine.drawWidth - grid.graphics.current!.width) / 2),
        Config.MinGridMargin);
    engine.add(grid);

    // --
    engine.add(new Actor({
        anchor: Vector.Zero,
        pos: vec(grid.pos.x, 0),
        width: grid.graphics.current!.width,
        height: grid.pos.y,
        color: Color.White,
        z: 200
    })); // top mask!

    installTitle(grid);

    // --
    const score = new Score(themeColor);
    score.pos = vec(
        Math.floor((grid.pos.x - score.graphics.current!.width) / 2),
        grid.pos.y + 6/*magic*/);
    engine.add(score);

    // --
    const nextPiece = new NextPiece(themeColor,
        engine.drawWidth - grid.pos.x
        - grid.graphics.current!.width - Config.NextPieceMargin.x * 2);
    nextPiece.pos = vec(grid.pos.x + grid.graphics.current!.width
        + Config.NextPieceMargin.x, score.pos.y);
    engine.add(nextPiece);

    // --
    let dropping = false;
    let state: State | undefined;

    let currentTimerInterval: number = Config.BaseTimerInterval;

    const maybeUpdateCurrentTimerInterval = (state: State) => {
        const level = Math.floor(state.numLinesCleared / 10);
        const newInterval
            = Config.BaseTimerInterval * Math.pow(0.9, level);
        if (newInterval < currentTimerInterval) {
            currentTimerInterval = newInterval;
            timer.interval = currentTimerInterval;
        }
    };

    // --
    const timer = new Timer({
        interval: currentTimerInterval,
        repeats: true,
        action: () => {
            // assert: state! (timer shouldn't start until state is initialized)
            tick(state!, engine, dropping).then((result) => {
                if (result.result === 'success' || result.result === 'success-and-spawned-piece') {
                    if (result.result === 'success-and-spawned-piece') {
                        // just in case the timer was accelerated because the piece
                        //   was being dropped
                        timer.interval = currentTimerInterval;
                    }
                    maybeUpdateCurrentTimerInterval(result.nextState);
                    nextPiece.setPieceType(result.nextState.nextPieceType);
                    score.setLevelAndScore(toLevel(result.nextState), result.nextState.score);
                    state = result.nextState;
                } else if (result.result == 'game-over') {
                    timer.stop();
                    showGameOverPanel(engine, themeColor, 'game over');
                    engine.emit('xelly:terminate');
                } else { // 'skipped'
                    // tick overlap
                }
            });
        }
    });
    engine.add(timer);

    // --
    const maxButtonGraphicVisibleWidth
        = Math.min(Config.MaxLeftRightButtonWidth,
        Math.round((engine.drawWidth - grid.graphics.current!.width
            - Config.MoveArrowButtonVisiblePadding.x * 4) / 2));

    const leftProm = createMoveArrowButton(themeColor, maxButtonGraphicVisibleWidth, 'left');
    const rightProm = createMoveArrowButton(themeColor, maxButtonGraphicVisibleWidth, 'right');
    Promise.all([leftProm, rightProm]).then(([moveLeft, moveRight]) => {
        moveLeft.pos = vec(
            Math.round((grid.pos.x - moveLeft.graphics.current!.width) / 2),
            engine.drawHeight - moveLeft.graphics.current!.height);
        moveRight.pos = vec(
            Math.round((engine.drawWidth + grid.pos.x + grid.graphics.current!.width - moveRight.graphics.current!.width) / 2),
            engine.drawHeight - moveRight.graphics.current!.height);
        rotateLeft.pos = vec(
            moveLeft.pos.x + moveLeft.graphics.current!.width,
            Math.floor((engine.drawHeight + grid.pos.y + grid.graphics.current!.height - rotateLeft.graphics.current!.height) / 2));
        rotateRight.pos = vec(
            moveRight.pos.x - rotateRight.graphics.current!.width,
            Math.floor((engine.drawHeight + grid.pos.y + grid.graphics.current!.height - rotateRight.graphics.current!.height) / 2));
        moveLeft.setHandler(() => {
            if (state && !dropping) {
                const result = tryMove(state, 'left');
                state = result.nextState;
            }
        });
        moveRight.setHandler(() => {
            if (state && !dropping) {
                const result = tryMove(state, 'right');
                state = result.nextState;
            }
        });
        rotateLeft.on('pointerdown', () => {
            if (state && !dropping) {
                const result = tryRotate(state, 'left');
                state = result.nextState;
            }
        });
        rotateRight.on('pointerdown', () => {
            if (state && !dropping) {
                const result = tryRotate(state, 'right');
                state = result.nextState;
            }
        });
        engine.add(moveLeft);
        engine.add(moveRight);
        engine.add(rotateLeft);
        engine.add(rotateRight);

        installSwipeDownHandler_(engine, (e: 'activated' | 'stopped') => {
            switch (e) {
                case 'activated':
                    timer.interval = 10;
                    dropping = true;
                    break;
                case 'stopped':
                    timer.interval = currentTimerInterval;
                    setTimeout(() => {
                        dropping = false;
                    }, 5);
                    break;
            }
        });
    });

    engine.on('xelly:enter', () => {
        grid.clear();
        state = spawnFirstPieceAndInitState(engine, themeColor, grid);
        timer.start();
    });
};
