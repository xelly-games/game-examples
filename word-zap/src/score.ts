import * as xel from '@xelly/xelly.js';
import {Actor, CollisionType, Color, Engine, vec, Vector} from 'excalibur';

export class Score extends Actor {

    score: number;

    constructor(engine: Engine, color: Color) {
        super({
            name: 'score',
            anchor: Vector.Right,
            pos: vec(engine.drawWidth - 5, 5),
            color,
            z: 100
        });
        this.score = 0;
        this.body.collisionType = CollisionType.PreventCollision;
    }

    addOrReplaceScoreGraphic(score: number) {
        // replaces old default graphic:
        this.graphics.use(xel.graphics.fromSpriteArray(
            xel.create.label(`Score: ${score}`),
            {
                color: this.color,
                backgroundColor: Color.White,
                borderWidth: 6,
                borderColor: this.color,
                cssWidthAndHeightOverride: cssWidthAndHeight =>
                    vec(cssWidthAndHeight.x + 20, cssWidthAndHeight.y + 20)
            }));
    }

    incrementScore() {
        this.addOrReplaceScoreGraphic(++this.score);
    }

}
