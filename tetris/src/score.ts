import * as xel from '@xelly/xelly.js';
import {
    Actor,
    CollisionType,
    Color,
    Engine,
    GraphicsGroup,
    vec,
    Vector
} from 'excalibur';
import {GraphicsGrouping} from 'excalibur/build/dist/Graphics/GraphicsGroup';

export class Score extends Actor {

    constructor(color: Color) {
        super({
            name: 'score',
            anchor: Vector.Zero
        });
        this.body.collisionType = CollisionType.PreventCollision;
        this.color = color;
        this.setLevelAndScore(0, 0);
    }

    setLevelAndScore(level: number, score: number) {
        const levelGraphic = xel.graphics.fromText(
            `Level: ${level}`,
            {
                color: this.color,
                backgroundColor: Color.White,
                pixelScheme: xel.XellyPixelScheme.Px2_0,
            });
        const scoreGraphic = xel.graphics.fromText(
            `${score}`,
            {
                color: this.color,
                backgroundColor: Color.White,
                pixelScheme: xel.XellyPixelScheme.Px2_0,
            });
        let members: GraphicsGrouping[] = [
            {
                graphic: levelGraphic,
                offset: vec(
                    Math.max(0, Math.floor((scoreGraphic.width - levelGraphic.width) / 2)),
                    0)
            },
            {
                graphic: scoreGraphic,
                offset: vec(
                    Math.max(0, Math.floor((levelGraphic.width - scoreGraphic.width) / 2)),
                    levelGraphic.height + 8/*magic*/)
            }
        ];
        const graphic = new GraphicsGroup({
            members
        });
        this.graphics.use(graphic);
    }

}
