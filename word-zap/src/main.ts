import * as xel from '@xelly/xelly.js';
import {
    Keyboard,
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    ActionSequence,
    Actor,
    Animation,
    AnimationStrategy,
    CollisionStartEvent,
    Engine,
    GlobalCoordinates,
    Handler,
    Line,
    ParallelActions,
    Timer,
    vec,
    Vector
} from 'excalibur';
import {Score} from './score';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime
};

const GroundMarginPixels = 15;
const FallingLettersMarginX = 10;
const InitialFallingVelocity = 120;

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const keyboard = new Keyboard(context, {
        minimizer: false,
        animateDepressedKeys: true
    });
    engine.add(keyboard);

    const tapToStart = new Actor({
        pos: vec(Math.floor(engine.drawWidth / 2),
            Math.floor(engine.drawHeight / 2)),
        z: 100,
    });
    tapToStart.graphics.use(xel.graphics.fromSpriteArray(
        xel.create.label('tap to start'), {
            color: context.color.fg,
            borderWidth: 8,
            borderRadius: 1,
            borderColor: context.color.fg,
            cssWidthAndHeightOverride: cssWidthAndHeight =>
                vec(cssWidthAndHeight.x + 60, cssWidthAndHeight.y + 60)
        }));

    keyboard.on('initialize', () => {
        const line = new Line({
            color: context.color.fg,
            thickness: 3,
            start: vec(0, 0),
            end: vec(engine.drawWidth, 0)
        });
        const ground = new Actor({
            name: 'ground', // used by collision detection
            anchor: Vector.Zero,
            pos: vec(0, keyboard.pos.y - GroundMarginPixels),
            width: line.width,
            height: line.height,
        });
        ground.graphics.use(line);
        engine.add(ground);

        tapToStart.pos = vec(Math.floor(engine.drawWidth / 2),
            Math.floor(ground.pos.y / 2));
        engine.add(tapToStart);
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
                graphic: xel.graphics.fromSpriteArray([[0, 0], [0, 3], [1, 1], [1, 4], [2, 1], [2, 3]]),
                duration: 30
            },
            {
                graphic: xel.graphics.fromSpriteArray([[0, 0], [0, 4], [1, 1], [1, 5], [3, 1], [3, 3]]),
                duration: 30
            }
        ]
    });

    const score = new Score(engine, context.color.fg);
    score.addOrReplaceScoreGraphic(0);
    engine.add(score);

    let currentFallingVelocity = InitialFallingVelocity;

    engine.on('xelly:enter', ((coords: GlobalCoordinates) => {
        tapToStart.kill();
        const timer = new Timer({
            action: () => {
                const newLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))/*A-Z*/;
                const newLetterGraphic
                    = xel.graphics.fromSpriteArray(xel.create.label(newLetter),
                    { color: context.color.fg });
                const newLetterActor = new Actor({
                    pos: vec(Math.random() * (engine.drawWidth - FallingLettersMarginX * 2 + 1)
                        + FallingLettersMarginX, 0),
                    vel: vec(0, currentFallingVelocity),
                    width: newLetterGraphic.width,
                    height: newLetterGraphic.height,
                });
                newLetterActor.graphics.use(newLetterGraphic);
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
                    const scale = 2.5;
                    // https://github.com/excaliburjs/Excalibur/discussions/2327#discussioncomment-2860453
                    const scaleSequence = new ActionSequence(score, ctx => {
                        ctx.scaleTo({
                            scale: vec(scale, scale),
                            duration: 200
                        });
                    });
                    const moveSequence = new ActionSequence(score, ctx => {
                        ctx.moveTo({
                            pos: vec(Math.floor(engine.drawWidth / 2)
                                + Math.floor(score.graphics.current!.width * scale / 2),
                                tapToStart.pos.y),
                            duration: 200
                        });
                    });
                    const parallel = new ParallelActions([scaleSequence, moveSequence]);
                    score.actions.runAction(parallel).toPromise().then(() => {
                        const skull = new Actor({
                            pos: vec(engine.drawWidth / 2,
                                score.pos.y - score.graphics.current!.height - 5),
                            scale: vec(2, 2)
                        });
                        skull.graphics.use(xel.graphics.fromSpriteArray(xel.gallery.SkullSprite,
                            {color: context.color.fg}));
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
