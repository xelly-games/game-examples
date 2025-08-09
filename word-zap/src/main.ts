import * as xel from '@xelly/xelly.js';
import {
    Keyboard,
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme
} from '@xelly/xelly.js';
import {
    ActionSequence,
    Actor,
    Animation,
    AnimationStrategy,
    CollisionStartEvent,
    Engine,
    GlobalCoordinates,
    Handler, ParallelActions,
    Timer,
    vec,
    Vector
} from 'excalibur';
import {Score} from './score';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime,
    pixelScheme: XellyPixelScheme.Px3_0
};

const GroundMarginCssPixels = 15;
const FallingLettersMarginScreenPixelsX = 10;
const InitialFallingPixelVelocity = 40;

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const keyboard = new Keyboard(context, {
        minimizer: false,
        animateDepressedKeys: true
    });
    engine.add(keyboard);

    const tapToStart = xel.actors.fromText(context,
        'tap to start',
        {
            bgAlpha: 1,
            spritePadding: vec(20, 10),
            borderWidth: 1,
            positioning: {
                anchor: Vector.Half,
                fractionalOffset: Vector.Half
            }
        },
        xel.actorArgs.fromPixelBasedArgs(context,
            {
                pos: vec(context.screen.pixel.width / 2, context.screen.pixel.height / 3),
                z: 100,
            }));
    engine.add(tapToStart);

    keyboard.on('initialize', () => {
        const ground = xel.actors.fromSprite(context,
            xel.create.line(0, 0, context.screen.pixel.width, 0),
            {},
            {
                name: 'ground',
                anchor: Vector.Zero,
                pos: vec(0, keyboard.pos.y - GroundMarginCssPixels)
            });
        engine.add(ground);
    });

    const liveLettersMap = new Map<string, Actor[]>();
    const pushLiveLetter = (letter: string, actor: Actor) => {
        (liveLettersMap.get(letter) ?? liveLettersMap.set(letter, []).get(letter)!).push(actor);
    };
    const popAllLiveForLetter = (letter: string) => {
        const candidates = liveLettersMap.get(letter);
        liveLettersMap.delete(letter);
        return candidates ?? [];
    };
    const popLiveLetter = (letter: string, actor: Actor) => {
        const candidates = liveLettersMap.get(letter);
        if (candidates) {
            const idx = candidates.indexOf(actor);
            if (idx >= 0) {
                candidates.splice(idx, 1);
            }
        }
    };

    const createExplosion = () => new Animation({
        strategy: AnimationStrategy.End,
        frames: [
            {
                graphic: xel.graphics.fromSprite(context, [[0, 0], [0, 3], [1, 1], [1, 4], [2, 1], [2, 3]]),
                duration: 30
            },
            {
                graphic: xel.graphics.fromSprite(context, [[0, 0], [0, 4], [1, 1], [1, 5], [3, 1], [3, 3]]),
                duration: 30
            }
        ]
    });

    const score = new Score(context);
    score.addOrReplaceScoreGraphic(0);
    engine.add(score);

    let currentFallingVelocity = InitialFallingPixelVelocity;

    engine.on('xelly:enter', ((coords: GlobalCoordinates) => {
        tapToStart.kill();
        const timer = new Timer({
            action: () => {
                const newLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))/*A-Z*/;
                const newLetterActor = xel.actors.fromText(context,
                    newLetter, {},
                    xel.actorArgs.fromPixelBasedArgs(context, {
                        pos: vec(Math.random() * (context.screen.pixel.width - FallingLettersMarginScreenPixelsX * 2 + 1) + FallingLettersMarginScreenPixelsX, 0),
                        vel: vec(0, currentFallingVelocity)
                    }));
                pushLiveLetter(newLetter, newLetterActor);
                newLetterActor.on('collisionstart', (e: CollisionStartEvent) => {
                    if (e.other.owner.name !== 'ground') {
                        return;
                    }
                    timer.stop();
                    for (const [key, value] of liveLettersMap) {
                        for (let item of value) {
                            item.vel = vec(0, 0);
                        }
                        liveLettersMap.delete(key);
                    }
                    // https://github.com/excaliburjs/Excalibur/discussions/2327#discussioncomment-2860453
                    const scaleSequence = new ActionSequence(score, ctx => {
                        ctx.scaleTo({
                            scale: vec(2, 2),
                            duration: 200
                        });
                    });
                    const moveSequence = new ActionSequence(score, ctx => {
                        ctx.moveTo({
                            pos: vec(context.screen.css.width / 2 + score.graphics.localBounds.width,
                                context.screen.css.height / 4),
                            duration: 200
                        });
                    });
                    const parallel = new ParallelActions([scaleSequence, moveSequence]);
                    score.actions.runAction(parallel).toPromise().then(() => {
                        const skull = xel.actors.fromSprite(context, xel.gallery.SkullSprite, {}, {
                            pos: vec(context.screen.css.width / 2,
                                score.pos.y - score.graphics.localBounds.height),
                            scale: vec(2, 2)
                        });
                        skull.actions.blink(150, 150, 2);
                        engine.add(skull);
                        engine.emit('xelly:terminate'); // !!!
                    });
                });
                engine.add(newLetterActor);
            },
            interval: 1000,
            repeats: true
        });
        engine.currentScene.add(timer);
        timer.start();
        keyboard.on('*keypress', (key: any) => {
            const popped = popAllLiveForLetter(key);
            for (let item of popped) {
                item.vel = vec(0, 0);
                const explosion = createExplosion();
                item.graphics.use(explosion);
                explosion.events.on('end', () => {
                    item.kill();
                    score.incrementScore();
                    if (score.score % 5 === 0) {
                        currentFallingVelocity += 10;
                    }
                });
            }
        });
    }) as Handler<any>);
};
