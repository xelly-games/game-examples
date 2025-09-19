import {Circle, Color, Line, vec} from 'excalibur';
import * as xel from '@xelly/xelly.js';

const Thickness = 3;

const headGraphic = (color: Color, width: number) => {
    return new Circle({
        radius: Math.round(width / 2),
        lineWidth: Thickness,
        strokeColor: color,
        color: Color.Transparent,
    });
};

const torsoGraphic = (color: Color, height: number) => {
    return new Line({
        thickness: Thickness,
        color,
        start: vec(0, 0),
        end: vec(0, height),
    });
};

const leftArmGraphic = (color: Color, length: number) => {
    return new Line({
        thickness: Thickness,
        color,
        start: vec(0, 0),
        end: vec(-length, 0),
    });
};

const rightArmGraphic = (color: Color, length: number) => {
    return new Line({
        thickness: Thickness,
        color,
        start: vec(0, 0),
        end: vec(length, 0),
    });
};

const leftLegGraphic = (color: Color, height: number) => {
    return new Line({
        thickness: Thickness,
        color,
        start: vec(0, 0),
        end: vec(-25/*magic*/, height),
    });
};

const rightLegGraphic = (color: Color, height: number) => {
    return new Line({
        thickness: Thickness,
        color,
        start: vec(0, 0),
        end: vec(25/*magic*/, height),
    });
};

const createEyeGraphic = (color: Color) => {
    return xel.graphics.fromSpriteArray([[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
        {color});
};

const createMouthGraphic = (color: Color) => {
    return xel.graphics.fromSpriteArray([[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]],
        {color});
};

export {
    headGraphic, torsoGraphic,
    leftArmGraphic, rightArmGraphic,
    leftLegGraphic, rightLegGraphic,
    createEyeGraphic, createMouthGraphic
};
