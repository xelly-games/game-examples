import {XellyContext, XellySpriteActor} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Config} from './constants';
import {CollisionType, Engine, Vector} from 'excalibur';

export class Ground extends XellySpriteActor {
    moving = false;

    constructor(context: XellyContext) {
        const height = Math.ceil(context.screen.pixel.height * 0.1);
        const lineSprite = xel.create.line(0, 0, context.screen.pixel.width * 2/*!!*/, 0)
            .filter((_, index) => index % 5 !== 0);
        super(xel.actorArgs.fromPixelBasedArgs(context, {
                y: context.screen.pixel.height - height,
                anchor: Vector.Zero,
                z: 1 // position the ground above everything
            }),
            context, lineSprite,
            {spritePadding: height / 2, bgAlpha: 1/*so we mask pipes etc underneath*/});
        this.body.collisionType = CollisionType.Fixed;
    }

    override onPostUpdate(engine: Engine, elapsed: number) {
        if (this.moving) {
            this.pos.x -= (elapsed / 1000) * Config.PipeSpeed;
            if (this.pos.x < -engine.drawWidth) {
                this.pos.x = 0;
            }
        }
    }

    start() {
        this.moving = true;
    }

    stop() {
        this.moving = false;
    }
}