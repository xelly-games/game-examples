import * as xel from '@xelly/xelly.js';
import {
    ActorArgsSansColliderArgs,
    XellyContext,
    XellySpriteActor
} from '@xelly/xelly.js';
import {Actor, Vector} from 'excalibur';

const eye: [number, number][] = [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]];

const mouth: [number, number][] = [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]];

const head: [number, number][] = xel.create.circle(0, 0, 6);

const torso: [number, number][] = xel.create.line(0, 0, 0, 15);

const legLeft: [number, number][] = xel.create.line(0, 10, 5, 0);

const legRight: [number, number][] = xel.create.line(0, 0, 5, 10);

const arm: [number, number][] = xel.create.line(0, 0, 5, 0);

const armYPercentDistanceDownBody = 0.25;
const eyeYPercentDistanceDownHead = 0.20;
const mouthYPercentDistanceDownHead = 0.60;

export const HangmanWidth = xel.measure.width(legLeft) + xel.measure.width(legRight);

/** */
export class HangmanActor extends XellySpriteActor {

    private readonly head: Actor;
    private readonly leye: Actor;
    private readonly reye: Actor;
    private readonly mouth: Actor;
    private readonly torso: Actor;
    private readonly larm: Actor;
    private readonly rarm: Actor;
    private readonly lleg: Actor;
    private readonly rleg: Actor;

    constructor(context: XellyContext, baseArgs: ActorArgsSansColliderArgs) {
        super(baseArgs, context, [], {});
        this.head = xel.actors.fromSprite(this.context, head, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: Math.round(xel.measure.width(legLeft) - xel.measure.width(head) / 2),
                y: 0
            }));
        this.leye = xel.actors.fromSprite(this.context, eye, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft) - Math.round(xel.measure.width(eye)),
                y: Math.round(eyeYPercentDistanceDownHead * xel.measure.height(head))
            }));
        this.reye = xel.actors.fromSprite(this.context, eye, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft) + 1,
                y: Math.round(eyeYPercentDistanceDownHead * xel.measure.height(head))
            }));
        this.mouth = xel.actors.fromSprite(this.context, mouth, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft) - Math.round(xel.measure.width(mouth) / 2) + 1,
                y: Math.round(mouthYPercentDistanceDownHead * xel.measure.height(head))
            }));
        this.torso = xel.actors.fromSprite(this.context, torso, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft),
                y: xel.measure.height(head)
            }));
        this.larm = xel.actors.fromSprite(this.context, arm, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft) - xel.measure.width(arm),
                y: xel.measure.height(head) + Math.round(armYPercentDistanceDownBody * xel.measure.height(torso))
            }));
        this.rarm = xel.actors.fromSprite(this.context, arm, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legLeft),
                y: xel.measure.height(head) + Math.round(armYPercentDistanceDownBody * xel.measure.height(torso))
            }));
        this.lleg = xel.actors.fromSprite(this.context, legLeft, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: 0,
                y: xel.measure.height(head) + xel.measure.height(torso)
            }));
        this.rleg = xel.actors.fromSprite(this.context, legRight, {},
            xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: xel.measure.width(legRight) + 1,
                y: xel.measure.height(head) + xel.measure.height(torso)
            }));


    }

    *cycle() {
        this.addChild(this.head);
        yield false;
        this.addChild(this.torso);
        yield false;
        this.addChild(this.larm);
        yield false;
        this.addChild(this.rarm);
        yield false;
        this.addChild(this.lleg);
        yield false;
        this.addChild(this.rleg);
        yield false;
        this.addChild(this.leye);
        yield false;
        this.addChild(this.reye);
        yield false;
        this.addChild(this.mouth);
        yield true;
    }

}
