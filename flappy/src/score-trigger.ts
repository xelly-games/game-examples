import {Actor, Collider, vec, Vector} from 'excalibur';
import {XellyContext} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Config} from './constants';

export class ScoreTrigger extends Actor {
    constructor(context: XellyContext,
                pixelPos: Vector,
                cssWidth: number) {
        super({
            name: 'score-trigger',
            anchor: Vector.Zero,
            width: cssWidth,
            vel: vec(-Config.PipeSpeed, 0),
            ...xel.actorArgs.fromPixelBasedArgs(context, {
                pos: pixelPos,
                height: Config.PipeGap
            })
        })
        this.on('exitviewport', () => {
            this.kill();
        });
    }
    override onCollisionStart(_self: Collider, other: Collider): void {
        if (other.owner.name === 'bird') {
            this.emit('score:tally');
        }
    }
}
