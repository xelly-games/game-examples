import {XellyContext} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Actor, CollisionType, vec, Vector} from 'excalibur';

export class Score extends Actor {

    context: XellyContext;
    score: number;

    constructor(context: XellyContext) {
        super(xel.actorArgs.fromPixelBasedArgs(context, {
            name: 'score',
            text: '0',
            opaque: true,
            anchor: Vector.Right,
            pos: vec(context.screen.pixel.width - 5, 5)
        }));
        this.context = context;
        this.score = 0;
        this.body.collisionType = CollisionType.PreventCollision;
    }

    incrementScore() {
        // replaces old default graphic:
        this.graphics.add(xel.graphics.fromSprite(this.context,
            xel.create.label(`${++this.score}`),
            {bgAlpha: 1}));
    }

}
