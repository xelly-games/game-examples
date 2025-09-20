import * as xel from '@xelly/xelly.js';
import {Actor, CollisionType, Color, Engine, vec, Vector} from 'excalibur';

export class Score extends Actor {

    score: number;

    constructor(engine: Engine, color: Color) {
        super({
            name: 'score',
            anchor: Vector.Right,
            pos: vec(engine.drawWidth - 15, 15)
        });
        this.score = 0;
        this.body.collisionType = CollisionType.PreventCollision;
        this.color = color;
    }

    incrementScore() {
        // replaces old default graphic:
        this.graphics.use(xel.graphics.fromText(
            `${++this.score}`,
            {color: this.color, backgroundColor: Color.White}));
    }

}
