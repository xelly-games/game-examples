import * as xel from '@xelly/xelly.js';
import {XellyContext} from '@xelly/xelly.js';
import {Actor, Color, Engine, vec} from 'excalibur';

const gameLabel: [number, number, Color?][] = xel.create.label('[game');
const overLabel: [number, number, Color?][] = xel.create.label('over]');

const graySkull: [number, number, Color][] = xel.gallery.SkullSprite.map(([x, y]) => [x, y, Color.LightGray]);

const gameOverSpriteArray =
    gameLabel
        .concat(xel.shift.x(graySkull, xel.measure.width(gameLabel) + 2))
        .concat(xel.shift.x(overLabel, xel.measure.width(gameLabel) + 2
            + xel.measure.width(xel.gallery.SkullSprite) + 2));

export const createGameOverActor = (context: XellyContext, engine: Engine) => {
    const actor = new Actor();
    actor.graphics.use(xel.graphics.fromSpriteArray(gameOverSpriteArray,
        { color: context.color.fg }));
    actor.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2);
    return actor;
};

export const createWinnerActor = (context: XellyContext, engine: Engine) => {
    const actor = new Actor();
    actor.graphics.use(xel.graphics.fromSpriteArray(xel.create.label('you won!!!!!!!!'),
        { color: context.color.fg }));
    actor.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2);
    return actor;
};
