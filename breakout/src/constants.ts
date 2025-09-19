import {XellyPixelScheme} from '@xelly/xelly.js';
import {vec} from 'excalibur';

export const Config = {
    BallAngularVelocity: 5,
    BallRadius_xelly: 2 /*... in sprite pixels*/,
    BallSpeed: vec(175, 175),
    PaddleSpeed: 300,
} as const;

export const GamePixelScheme = XellyPixelScheme.Px3_0;
