import {XellyContext} from '@xelly/xelly.js';
import * as xel from '@xelly/xelly.js';
import {Actor, CollisionType, vec, Vector} from 'excalibur';

const marginy = 1;
const paddingx = 3;
const paddingy = 1;
const columns = 5;
const rows = 5;
const brickHeight = 6;

export const createBricks = (context: XellyContext): Actor[] => {
    const brickWidth = Math.floor((context.screen.pixel.width - paddingx * (columns - 1) - 4/*buffer*/) / columns);
    const useMarginX = Math.floor((context.screen.pixel.width - ((brickWidth + paddingx) * columns - paddingx)) / 2);
    const bricks: Actor[] = [];
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
            const xellyX = useMarginX + i * (brickWidth + paddingx);
            const xellyY = marginy + j * (brickHeight + paddingy);
            const brick = xel.actors.fromSprite(
                context,
                xel.create.rect(0, 0, brickWidth, brickHeight),
                {},
                xel.actorArgs.fromPixelBasedArgs(context, {
                    name: `brick-${i}:${j}`,
                    pos: vec(xellyX, xellyY),
                    anchor: Vector.Zero,
                }));
            brick.body.collisionType = CollisionType.Active;
            bricks.push(brick);
        }
    }
    return bricks;
};
