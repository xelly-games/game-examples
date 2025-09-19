import {Actor, Collider, vec, Vector} from 'excalibur';
import {Config} from './constants';

export class ScoreTrigger extends Actor {
    constructor(pos: Vector,
                cssWidth: number) {
        super({
            name: 'score-trigger',
            anchor: Vector.Zero,
            width: cssWidth,
            vel: vec(-Config.PipeSpeed, 0),
            pos,
            height: Config.PipeGap,
            //color: Color.Green
        })
        this.on('postupdate', () => {
            if (this.pos.x < 0) {
                this.kill();
            }
        });
    }
    override onCollisionStart(_self: Collider, other: Collider): void {
        if (other.owner.name === 'bird') {
            this.emit('score:tally');
        }
    }
}
