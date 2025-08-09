import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Paddle} from './paddle';
import {Ball} from './ball';
import {createBricks} from './bricks';
import {Config} from './constants';
import {Engine, GlobalCoordinates, Handler, vec} from 'excalibur';

export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const paddle = new Paddle(context);
    const bricks = createBricks(context);
    const ball = new Ball(context, bricks);

    let inputDisabled = false;
    const inputHandler = (e: GlobalCoordinates) => {
        if (inputDisabled)
            return;
        if (!paddle.started) {
            paddle.started = true;
            if (e.worldPos.x < paddle.pos.x) {
                paddle.vel.x = -Config.PaddleSpeed;
            } else {
                paddle.vel.x = Config.PaddleSpeed;
            }
        } else if (Math.abs(paddle.vel.x) < 1) {
            if (paddle.pos.x > engine.drawWidth / 2) {
                paddle.vel.x = -Config.PaddleSpeed;
            } else {
                paddle.vel.x = Config.PaddleSpeed;
            }
        } else {
            paddle.vel.x = -paddle.vel.x;
        }
    };

    engine.input.pointers.primary.on('down', inputHandler);

    // engine.input.pointers.primary.once('down', () => ball.start());
    engine.once('xelly:enter', ((coords: GlobalCoordinates) => {
        // note: xelly.js will also emit a pointer event for the "click" that
        //  the user used to enter the game
        if (coords.worldPos.x < engine.drawWidth / 2) {
            ball.start('left');
        } else {
            ball.start('right');
        }
    }) as Handler<any>);

    engine.add(paddle);
    engine.add(ball);
    bricks.forEach(brick => {
        engine.add(brick);
    });

    // todo help w/ this in lib?
    const gameLabel = xel.create.label('[game');
    const [gameLabelWidth, gameLabelHeight]
        = [xel.sprites.width(gameLabel), xel.sprites.height(gameLabel)];
    const [skullWidth, skullHeight]
        = [xel.sprites.width(xel.gallery.SkullSprite), xel.sprites.height(xel.gallery.SkullSprite)];
    const overLabel = xel.create.label('over]');
    const [overLabelWidth, overLabelHeight]
        = [xel.sprites.width(overLabel), xel.sprites.height(overLabel)];

    const compositeGameOverSprite =
        gameLabel
            .concat(xel.sprites.xshift(xel.gallery.SkullSprite, gameLabelWidth + 2))
            .concat(xel.sprites.xshift(overLabel, gameLabelWidth + 2 + skullWidth + 2));

    const gameOver = xel.actors.fromSprite(context, compositeGameOverSprite, {bgAlpha: 1},
        xel.actorArgs.fromPixelBasedArgs(context, {
            name: 'game-over-label',
            pos: vec(context.screen.pixel.width / 2, context.screen.pixel.height / 2),
            silenceWarnings: true
        }));

    const gameWinner = xel.actors.fromSprite(context,
        xel.create.label('you won!!!!!!!!!!'), {bgAlpha: 1},
        xel.actorArgs.fromPixelBasedArgs(context, {
            name: 'game-won-label',
            pos: vec(context.screen.pixel.width / 2, context.screen.pixel.height / 2),
            silenceWarnings: true
        }));

    ball.on('no-more-bricks', () => {
        inputDisabled = true;
        paddle.kill();
        ball.stop();
        engine.add(gameWinner);
        engine.emit('xelly:terminate');
    })

    ball.on('ball:missed', () => {
        inputDisabled = true;
        paddle.kill();
        ball.stop();
        engine.add(gameOver);
        engine.emit('xelly:terminate');
    });

    // const ruler = new XellyActor(engine.context, {
    //     anchor: Vector.Zero,
    //     pos: units.xelly.vec(1, 1),
    //     height: units.css.val(engine.screen.viewport.height - engine.context.toCssScale(units.xelly.val(2))!),
    //     width: units.xelly.val(1)
    // });
    // engine.add(ruler);
};
