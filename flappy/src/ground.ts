import {Config} from './constants';
import {
    Actor,
    CollisionType,
    Color,
    Engine,
    Rectangle,
    Vector
} from 'excalibur';

const GroundLineWidth = 9;

export class Ground extends Actor {

    moving = false;
    private readonly restartPos: number;

    constructor(color: Color, engine: Engine) {
        const height = engine.drawHeight * 0.13;
        const useWidth = (engine.drawWidth + GroundLineWidth) * 2;
        const lineDash = [16, 8];
        super({
            x: - GroundLineWidth,
            y: engine.drawHeight - height + GroundLineWidth,
            anchor: Vector.Zero,
            z: 1, // position the ground above everything
            // by providing width and height here we get a (Box) collider
            width: useWidth,
            height: height,
        });
        const graphic = new Rectangle({
            quality: 4,
            width: useWidth,
            height: height,
            lineWidth: GroundLineWidth,
            strokeColor: color,
            color: Color.White/*hide what's underneath*/,
            lineDash: lineDash
        });
        this.graphics.use(graphic);
        this.body.collisionType = CollisionType.Fixed;
        this.restartPos =
            (Math.floor(
                (Math.floor(useWidth / 2) - (lineDash[0] + lineDash[1]))
                / (lineDash[0] + lineDash[1])) + 1)
            * (lineDash[0] + lineDash[1]);
    }

    override onPostUpdate(engine: Engine, elapsed: number) {
        if (this.moving) {
            this.pos.x -= (elapsed / 1000) * Config.PipeSpeed;
            if (this.pos.x < - this.restartPos) {
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
