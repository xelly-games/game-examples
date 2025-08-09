import {Random, Scene, Timer, vec} from 'excalibur';
import {XellyContext} from '@xelly/xelly.js';
import {Pipe} from './pipe';
import {Config} from './constants';
import {ScoreTrigger} from './score-trigger';

export class PipeFactory {
    private timer: Timer;

    constructor(
        private context: XellyContext,
        private level: Scene,
        private random: Random) {
        this.timer = new Timer({
            interval: Config.PipeIntervalMs,
            repeats: true,
            action: () => this.spawnPipes(context)
        });
        this.level.add(this.timer);
    }

    spawnPipes(context: XellyContext) {
        const randomPipePosition
            = this.random.integer(0, context.screen.pixel.height - Config.PipeGap);
        const bottomPipe = new Pipe(
            this.context,
            vec(context.screen.pixel.width, randomPipePosition + Config.PipeGap),
            'bottom');
        this.level.add(bottomPipe);
        const topPipe = new Pipe(
            this.context,
            vec(context.screen.pixel.width, randomPipePosition),
            'top');
        this.level.add(topPipe);
        const scoreTrigger = new ScoreTrigger(
            context,
            vec(context.screen.pixel.width, randomPipePosition),
            topPipe.width);
        scoreTrigger.once('score:tally', () => this.level.emit('score:tally'));
        this.level.add(scoreTrigger);
    }

    start() {
        this.timer.start();
    }

    reset() {
        for (const actor of this.level.actors) {
            if (actor instanceof Pipe ||
                actor instanceof ScoreTrigger) {
                actor.kill();
            }
        }
    }

    stop() {
        this.timer.stop();
        for (const actor of this.level.actors) {
            if (actor instanceof Pipe ||
                actor instanceof ScoreTrigger) {
                actor.vel = vec(0, 0);
            }
        }
    }
}
