import {XellyContext} from '@xelly/xelly.js';
import {Actor, CollisionType, Engine, vec, Vector} from 'excalibur';

export class Paddle extends Actor {

    started: boolean;

    constructor(context: XellyContext, engine: Engine) {
        super({
            name: 'paddle',
            pos: vec(engine.drawWidth / 2, engine.drawHeight - 10),
            vel: Vector.Zero,
            width: Math.round(engine.drawWidth / 5),
            height: 5,
            color: context.color.fg
        });
        this.body.collisionType = CollisionType.Fixed;
        this.started = false;
    }

    override onPostUpdate(engine: Engine): void {
        if (this.pos.x <= this.width / 2 && this.vel.x < 0) {
            this.pos.x = this.width / 2;
            this.vel.x = 0;
        }
        if (this.pos.x >= engine.drawWidth - this.width / 2 && this.vel.x > 0) {
            this.pos.x = engine.drawWidth - this.width / 2;
            this.vel.x = 0;
        }
    }
}
