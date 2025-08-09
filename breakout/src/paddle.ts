import {XellyContext, XellySpriteActor} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {CollisionType, Engine, vec} from 'excalibur';

export class Paddle extends XellySpriteActor {

    started: boolean;

    constructor(context: XellyContext) {
        const sprite
            = xel.create.filledRect(0, 0, Math.round(context.screen.pixel.width / 5), 2);
        super(xel.actorArgs.fromPixelBasedArgs(context, {
            name: 'paddle',
            pos: vec(context.screen.pixel.width / 2, context.screen.pixel.height - 1),
            vel: vec(0, 0)
        }), context, sprite, {});
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
