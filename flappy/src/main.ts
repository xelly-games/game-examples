import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Bird, DeadBirdBody, DeadBirdHead} from './bird';
import {Ground} from './ground';
import {Score} from './score';
import {PipeFactory} from './pipe-factory';
import {Engine, GlobalCoordinates, Handler, Random, vec} from 'excalibur';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Realtime
};

export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const random = new Random();

    const bird = new Bird(context.color.fg, engine);
    const ground = new Ground(context.color.fg, engine);

    const scene = engine.currentScene;

    const pipes = new PipeFactory(engine, context.color.fg, scene, random);

    engine.once('xelly:enter', ((coords: GlobalCoordinates) => {
        bird.startWithAJump(); // we want the bird to jump on entry too (nice ux)!
        pipes.start();
        ground.start();
    }) as Handler<any>);

    bird.on('bird:ouchie', () => {
        bird.kill();
        engine.rootScene.add(new DeadBirdHead(context.color.fg, vec(bird.pos.x, bird.pos.y)));
        engine.rootScene.add(new DeadBirdBody(context.color.fg, vec(bird.pos.x, bird.pos.y)));
        pipes.stop();
        ground.stop();
        engine.emit('xelly:terminate');
    });

    const score = new Score(engine, context.color.fg);

    scene.on('score:tally', () => {
        score.incrementScore();
    });

    engine.add(score);
    engine.add(bird);
    engine.add(ground);
};
