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
            pos: vec(context.screen.pixel.width - 5, 5),
            z: 100
        }));
        this.context = context;
        this.score = 0;
        this.body.collisionType = CollisionType.PreventCollision;
    }

    addOrReplaceScoreGraphic(score: number) {
        // replaces old default graphic:
        this.graphics.add(xel.graphics.fromSprite(this.context,
            xel.create.label(`Score: ${score}`),
            {bgColor: 'negative', bgAlpha: 1, borderWidth: 1, spritePadding: 3,
                positioning: {anchor: Vector.Half, fractionalOffset: Vector.Half}}));
    }

    incrementScore() {
        this.addOrReplaceScoreGraphic(++this.score);
    }

}
