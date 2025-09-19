import {Actor, ActorArgs, vec} from 'excalibur';

import {
    createEyeGraphic,
    createMouthGraphic,
    headGraphic,
    leftArmGraphic,
    leftLegGraphic,
    rightArmGraphic,
    rightLegGraphic,
    torsoGraphic
} from './graphics';
import {SizingRatios, Sizings} from './sizing';

const _hide = (actor: Actor) => { actor.graphics.isVisible = false; return actor; }
const _show = (actor: Actor) => { actor.graphics.isVisible = true; return actor; }

export class Hangman extends Actor {

    private readonly head: Actor;
    private readonly torso: Actor;
    private readonly leftArm: Actor;
    private readonly rightArm: Actor;
    private readonly leftLeg: Actor;
    private readonly rightLeg: Actor;
    private readonly leftEye: Actor;
    private readonly rightEye: Actor;
    private readonly mouth: Actor;

    constructor(actorArgs: ActorArgs, private sizings: Sizings, private hardMode: boolean) {
        super(actorArgs);
        this.head = _hide(this.createHead());
        this.torso = _hide(this.createTorso(this.head));
        this.leftArm = _hide(this.createLeftArm(this.head, this.torso));
        this.rightArm = _hide(this.createRightArm(this.head, this.torso));
        this.leftLeg = _hide(this.createLeftLeg(this.torso));
        this.rightLeg = _hide(this.createRightLeg(this.torso));
        this.leftEye = _hide(this.createLeftEye(this.head));
        this.rightEye = _hide(this.createRightEye(this.head));
        this.mouth = _hide(this.createMouth(this.head));
        this.addChild(this.head);
        this.addChild(this.torso);
        this.addChild(this.leftArm);
        this.addChild(this.rightArm);
        this.addChild(this.leftLeg);
        this.addChild(this.rightLeg);
        this.addChild(this.leftEye);
        this.addChild(this.rightEye);
        this.addChild(this.mouth);
    }

    createHead() {
        const actor = new Actor({
            anchor: vec(0.5, 0),
            pos: vec(0, 0)
        });
        actor.graphics.use(headGraphic(this.color, this.sizings.headWidth));
        return actor;
    }

    createTorso(head: Actor) {
        const actor = new Actor({
            anchor: vec(0.5, 0),
            pos: vec(
                head.pos.x,
                head.pos.y + head.graphics.current!.height
                - Math.floor(this.sizings.thickness / 2))
        });
        actor.graphics.use(torsoGraphic(this.color,
            Math.round(
                SizingRatios.BodyTorsoPercentOfBodyBelowNeck *
                (this.sizings.totalBelowDropHeight
                    - head.graphics.current!.height
                    - this.sizings.totalBelowDropHeight
                    * SizingRatios.BodyGapBelowFeetPercentOfTotalBelowDrop))));
        return actor;
    }

    createLeftArm(head: Actor, torso: Actor) {
        const actor = new Actor({
            anchor: vec(0, 0),
            pos: vec(
                torso.pos.x - Math.round(this.sizings.thickness / 4/*?*/),
                torso.pos.y + torso.graphics.current!.height
                * SizingRatios.BodyArmOffsetBelowHeadPercentOfTorso)
        });
        actor.graphics.use(leftArmGraphic(this.color,
            Math.round(
                SizingRatios.BodyArmLengthPercentOfBodyHeight *
                (head.graphics.current!.height +
                    torso.graphics.current!.height
                    / SizingRatios.BodyTorsoPercentOfBodyBelowNeck))));
        return actor;
    }

    createRightArm(head: Actor, torso: Actor) {
        const actor = new Actor({
            anchor: vec(0, 0),
            pos: vec(
                torso.pos.x - Math.round(this.sizings.thickness / 4/*?*/),
                torso.pos.y + torso.graphics.current!.height
                * SizingRatios.BodyArmOffsetBelowHeadPercentOfTorso)
        });
        actor.graphics.use(rightArmGraphic(this.color,
            Math.round(
                SizingRatios.BodyArmLengthPercentOfBodyHeight *
                (head.graphics.current!.height +
                    torso.graphics.current!.height
                    / SizingRatios.BodyTorsoPercentOfBodyBelowNeck))));
        return actor;
    }

    createLeftLeg(torso: Actor) {
        const actor = new Actor({
            anchor: vec(0, 0),
            pos: vec(
                torso.pos.x - Math.round(this.sizings.thickness / 4/*?*/),
                torso.pos.y + torso.graphics.current!.height
                - Math.round(this.sizings.thickness / 4))
        });
        actor.graphics.use(leftLegGraphic(this.color,
            Math.round(
                SizingRatios.BodyTorsoPercentOfBodyBelowNeck *
                (this.sizings.totalBelowDropHeight
                    - torso.graphics.current!.height
                    - this.sizings.totalBelowDropHeight
                    * SizingRatios.BodyGapBelowFeetPercentOfTotalBelowDrop))));
        return actor;
    }

    createRightLeg(torso: Actor) {
        const actor = new Actor({
            anchor: vec(0, 0),
            pos: vec(
                torso.pos.x - Math.round(this.sizings.thickness / 4/*?*/),
                torso.pos.y + torso.graphics.current!.height
                - Math.round(this.sizings.thickness / 4))
        });
        actor.graphics.use(rightLegGraphic(this.color,
            Math.round(
                SizingRatios.BodyTorsoPercentOfBodyBelowNeck *
                (this.sizings.totalBelowDropHeight
                    - torso.graphics.current!.height
                    - this.sizings.totalBelowDropHeight
                    * SizingRatios.BodyGapBelowFeetPercentOfTotalBelowDrop))));
        return actor;
    }

    createLeftEye(head: Actor) {
        const actor = new Actor({
            anchor: vec(0.5, 0),
            pos: vec(
                head.pos.x - Math.floor(head.graphics.current!.width * 0.15/*magic*/),
                head.pos.y + Math.floor(head.graphics.current!.height * 0.26/*magic*/))
        });
        actor.graphics.use(createEyeGraphic(this.color));
        return actor;
    }

    createRightEye(head: Actor) {
        const actor = new Actor({
            anchor: vec(0.5, 0),
            pos: vec(
                head.pos.x + Math.floor(head.graphics.current!.width * 0.15/*magic*/),
                head.pos.y + Math.floor(head.graphics.current!.height * 0.26/*magic*/))
        });
        actor.graphics.use(createEyeGraphic(this.color));
        return actor;
    }

    createMouth(head: Actor) {
        const actor = new Actor({
            anchor: vec(0.5, 0),
            pos: vec(head.pos.x,
                head.pos.y + Math.floor(head.graphics.current!.height * 0.62/*magic*/))
        });
        actor.graphics.use(createMouthGraphic(this.color));
        return actor;
    }

    *cycle() {
        _show(this.head);
        yield false;
        _show(this.torso);
        yield false;
        _show(this.leftArm);
        if (!this.hardMode) {
            yield false;
        }
        _show(this.rightArm);
        yield false;
        _show(this.leftLeg);
        if (!this.hardMode) {
            yield false;
        }
        _show(this.rightLeg);
        yield false;
        _show(this.leftEye);
        if (!this.hardMode) {
            yield false;
        }
        _show(this.rightEye);
        yield false;
        _show(this.mouth);
        yield true;
    }

}
