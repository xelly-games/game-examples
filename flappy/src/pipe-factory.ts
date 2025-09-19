import {Color, Engine, Random, Scene, Timer, vec} from 'excalibur';
import {Pipe} from './pipe';
import {Config} from './constants';
import {ScoreTrigger} from './score-trigger';

export class PipeFactory {
    private timer: Timer;

    constructor(
        private engine: Engine,
        private color: Color,
        private level: Scene,
        private random: Random) {
        this.timer = new Timer({
            interval: Config.PipeIntervalMs,
            repeats: true,
            action: () => this.spawnPipes()
        });
        this.level.add(this.timer);
    }

    spawnPipes() {
        const randomPipePosition
            = this.random.integer(0, this.engine.drawHeight - Config.PipeGap);
        const bottomPipe = new Pipe(this.engine, this.color,
            vec(this.engine.drawWidth, randomPipePosition + Config.PipeGap),
            'bottom');
        this.level.add(bottomPipe);
        const topPipe = new Pipe(this.engine, this.color,
            vec(this.engine.drawWidth, randomPipePosition),
            'top');
        this.level.add(topPipe);
        const scoreTrigger = new ScoreTrigger(
            vec(this.engine.drawWidth + topPipe.width, randomPipePosition),
            5/*arbitrary*/);
        scoreTrigger.once('score:tally',
            () => this.level.emit('score:tally'));
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
