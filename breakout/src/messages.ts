import * as xel from '@xelly/xelly.js';
import {Color, Engine, vec} from 'excalibur';

const gameLabel: [number, number, Color?][] = xel.create.label('[game');
const overLabel: [number, number, Color?][] = xel.create.label('over]');

const graySkull: [number, number, Color][] = xel.gallery.SkullSprite.map(([x, y]) => [x, y, Color.LightGray]);

const gameOverSpriteArray =
    gameLabel
        .concat(xel.shift.x(graySkull, xel.measure.width(gameLabel) + 2))
        .concat(xel.shift.x(overLabel, xel.measure.width(gameLabel) + 2
            + xel.measure.width(xel.gallery.SkullSprite) + 2));

export const createGameOverActor = (themeColor: Color, engine: Engine) => {
    const actor = xel.actors.fromSpriteArray(gameOverSpriteArray, {color: themeColor});
    actor.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2);
    return actor;
};

export const createWinnerActor = (themeColor: Color, engine: Engine) => {
    const actor = xel.actors.fromText('you won!!!!!!!!', {color: themeColor});
    actor.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2);
    return actor;
};
