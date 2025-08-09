import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme
} from '@xelly/xelly.js';
import {
    Actor,
    Animation,
    Engine,
    ImageSource,
    PointerEvent,
    range,
    SpriteSheet,
    Timer,
    vec,
    Vector
} from 'excalibur';
import playerRun from './player-run.png';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Interactive,
    pixelScheme: XellyPixelScheme.Px2_0
};

const runImage = new ImageSource(playerRun);
const runSheet = SpriteSheet.fromImageSource({
    image: runImage,
    grid: {
        rows: 1,
        columns: 21,
        spriteWidth: 96,
        spriteHeight: 96
    }
});
const standingAnim = Animation.fromSpriteSheet(runSheet, range(0, 0), 50);
const leftAnim = Animation.fromSpriteSheet(runSheet, range(1, 10), 50);
const rightAnim = Animation.fromSpriteSheet(runSheet, range(11, 20), 50);

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const vel = vec(200, 0);
    const actor = new Actor({
        pos: vec(0, engine.halfDrawHeight)
    });
    const updateDirection = (direction: -1 | 0 | 1) => {
        actor.vel = vel.scale(vec(direction, 0));
        actor.graphics.use(actor.vel.x == 0 ? standingAnim
            : actor.vel.x < 0 ? leftAnim : rightAnim);
    };
    actor.on('postupdate', () => {
        if (actor.pos.x > engine.drawWidth) {
            updateDirection(-1);
        } else if (actor.pos.x < 0) {
            updateDirection(1);
        }
    });
    const timer = new Timer({
        action: () => {
            if (actor.vel.equals(Vector.Zero)) {
                updateDirection(Math.random() < 0.5 ? -1 : 1);
            } else {
                actor.vel = Vector.Zero;
                actor.graphics.use(standingAnim);
            }
        },
        randomRange: [0, 1000],
        interval: 3000,
        repeats: true
    });
    engine.add(timer);
    engine.on('xelly:start', () => {
        runImage.load().then(() => {
            engine.add(actor);
            updateDirection(1);
            timer.start();
        });
    });
    engine.input.pointers.on('down', (e: PointerEvent) => {
        if (actor.vel.equals(Vector.Zero)) {
            updateDirection(Math.sign(actor.pos.x - e.screenPos.x) as -1 | 1);
        } else {
            updateDirection(-Math.sign(actor.vel.x) as -1 | 1);
        }
    });
};
