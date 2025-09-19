import {XellyContext} from '@xelly/xelly.js';
import {
    Actor,
    ColliderComponent,
    CollisionType,
    Color,
    Engine,
    Rectangle,
    Shape,
    vec,
    Vector
} from 'excalibur';

const marginy = 3;
const paddingx = 9;
const paddingy = 3;
const columns = 5;
const rows = 5;
const brickHeight = 18;

export const createBricks = (context: XellyContext, engine: Engine): Actor[] => {
    const brickWidth = Math.floor((engine.drawWidth - paddingx * (columns - 1) - 4/*buffer*/) / columns);
    const useMarginX = Math.floor((engine.drawWidth - ((brickWidth + paddingx) * columns - paddingx)) / 2);
    const bricks: Actor[] = [];
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
            const x = useMarginX + i * (brickWidth + paddingx);
            const y = marginy + j * (brickHeight + paddingy);
            const brick = new Actor({
                pos: vec(x, y),
                anchor: Vector.Zero
            });
            brick.graphics.use(new Rectangle({
                width: brickWidth,
                height: brickHeight,
                lineWidth: 6,
                strokeColor: context.color.fg,
                color: Color.Transparent
            }));
            // note: setting width and height on actor would give us this collider for free, but
            //  will be explicit here to show how colliders are set:
            brick.collider = new ColliderComponent(Shape.Box(brickWidth, brickHeight, brick.anchor));
            brick.addComponent(brick.collider, true);
            brick.body.collisionType = CollisionType.Active;
            bricks.push(brick);
        }
    }
    return bricks;
};
