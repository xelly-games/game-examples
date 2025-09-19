import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Engine, GlobalCoordinates, Handler} from 'excalibur';
import {Paddle} from './paddle';
import {Ball} from './ball';
import {createBricks} from './bricks';
import {Config} from './constants';
import {createGameOverActor, createWinnerActor} from './messages';

export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const paddle = new Paddle(context, engine);
    const bricks = createBricks(context, engine);
    const ball = new Ball(context, engine, bricks);

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

    ball.on('no-more-bricks', () => {
        inputDisabled = true;
        paddle.kill();
        ball.stop();
        engine.add(createWinnerActor(context, engine));
        engine.emit('xelly:terminate');
    })

    ball.on('ball:missed', () => {
        inputDisabled = true;
        paddle.kill();
        ball.stop();
        engine.add(createGameOverActor(context, engine));
        engine.emit('xelly:terminate');
    });
};
