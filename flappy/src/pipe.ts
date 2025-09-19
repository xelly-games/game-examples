import {
    Actor,
    CollisionType,
    Color,
    Engine,
    GraphicsGroup,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import {Config} from './constants';

const PipeLineWidth = 6;
const PipeRimHeight = 14;
const PipeRimOverhang = 3;

export class Pipe extends Actor {
    constructor(engine: Engine, color: Color, pos: Vector, public type: 'top' | 'bottom') {
        const width = Math.round(engine.drawWidth * 0.12);
        const part = new Rectangle({
            quality: 4,
            width: width - PipeRimOverhang * 2,
            height: engine.drawHeight,
            lineWidth: PipeLineWidth,
            strokeColor: color,
            color: Color.White
        });
        const rim = new Rectangle({
            quality: 4,
            width: width,
            height: PipeRimHeight,
            lineWidth: PipeLineWidth,
            strokeColor: color,
            color: Color.White
        });
        const graphic = new GraphicsGroup({
            useAnchor: true,
            members: [
                {
                    graphic: part,
                    offset: vec(PipeRimOverhang, PipeRimHeight - PipeLineWidth)
                },
                {
                    graphic: rim,
                    offset: vec(0, 0)
                }
            ]
        });
        super({
            name: 'pipe',
            anchor: type === 'bottom' ?
                Vector.Zero : // bottom anchor from top left
                Vector.Down, // top anchor from the bottom left
            vel: vec(-Config.PipeSpeed, 0),
            z: -1,
            pos,
            // setting w + h gives us a Box collider:
            width: graphic.width,
            height: graphic.height
        });
        if (type === 'top') {
            graphic.flipVertical = true;
        }
        this.graphics.use(graphic);
        this.body.collisionType = CollisionType.Fixed;
        this.on('exitviewport', () => this.kill());
    }

}