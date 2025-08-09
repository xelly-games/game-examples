import {CollisionType, vec, Vector} from 'excalibur';
import {XellyContext, XellySpriteActor} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Config} from './constants';

export class Pipe extends XellySpriteActor {
    constructor(context: XellyContext, pixelPos: Vector, public type: 'top' | 'bottom') {
        const width = Math.round(context.screen.pixel.width * 0.1);
        const sprite: [number, number][] = [];
        if (type === 'bottom') {
            sprite.push(...xel.create.line(0, 0, width, 0)
                .concat(xel.create.line(width, 0, width, 3))
                .concat(xel.create.line(width, 3, 0, 3))
                .concat(xel.create.line(0, 3, 0, 0))
                .concat(xel.create.line(1, 3, 1, context.screen.pixel.height))
                .concat(xel.create.line(width - 1, 3, width - 1, context.screen.pixel.height))
                .concat(xel.create.line(1, context.screen.pixel.height, width - 1, context.screen.pixel.height)));
        } else {
            sprite.push(...xel.create.line(0, context.screen.pixel.height, width, context.screen.pixel.height)
                .concat(xel.create.line(width, context.screen.pixel.height, width, context.screen.pixel.height - 3))
                .concat(xel.create.line(width, context.screen.pixel.height - 3, 0, context.screen.pixel.height - 3))
                .concat(xel.create.line(0, context.screen.pixel.height - 3, 0, context.screen.pixel.height))
                .concat(xel.create.line(1, context.screen.pixel.height - 3, 1, 0))
                .concat(xel.create.line(1, 0, width - 1, 0))
                .concat(xel.create.line(width - 1, 0, width - 1, context.screen.pixel.height - 3)));
        }
        super({
            name: 'pipe',
            anchor: type === 'bottom' ?
                Vector.Zero : // bottom anchor from top left
                Vector.Down, // top anchor from the bottom left
            vel: vec(-Config.PipeSpeed, 0),
            z: -1,
            ...xel.actorArgs.fromPixelBasedArgs(context, {
                pos: pixelPos
            })
        }, context, sprite);
        this.body.collisionType = CollisionType.Fixed;
        this.on('exitviewport', () => this.kill());
    }

}