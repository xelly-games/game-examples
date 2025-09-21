import * as xel from '@xelly/xelly.js';
import {
    Actor,
    Animation,
    AnimationStrategy,
    clamp,
    Collider,
    CollisionType,
    Color,
    Engine,
    vec,
    Vector
} from 'excalibur';
import {Ground} from './ground';
import {Pipe} from './pipe';
import {Config} from './constants';

const flappyBirdHeadSprite: [number, number][] = [
    [3, 1], [3, 2], [3, 3],
    [4, 0], [4, 4],
    [5, 0], [5, 2], [5, 4],
    [6, 0], [6, 4],
    [7, 1], [7, 2], [7, 3],
    [8, 2], [8, 4],
    [9, 2]
];

const flappyBirdHeadClosedMouthSprite: [number, number][] = [
    [3, 1], [3, 2], [3, 3],
    [4, 0], [4, 4],
    [5, 0], [5, 2], [5, 4],
    [6, 0], [6, 4],
    [7, 1], [7, 2], [7, 3],
    [8, 2], [8, 3], // *
    [9, 2]
];

const flappyBirdBodySprite: [number, number][] = [
    [0, 4],
    [1, 5], [1, 6],
    [2, 5], [2, 6], [2, 7],
    [3, 5], [3, 6],
    [4, 6],
    [5, 6], [5, 7],
    [6, 5], [6, 6],
];

const flappyBirdSprite: [number, number][] = flappyBirdHeadSprite.concat(flappyBirdBodySprite);

const flappyBirdWingUpSprite1: [number, number][] = flappyBirdHeadClosedMouthSprite.concat([
    [0, 5], // straight tail
    [1, 2], [1, 5], [1, 6],
    [2, 3], [2, 5], [2, 6], [2, 7],
    [3, 4], [3, 5], [3, 6],
    [4, 6],
    [5, 6], [5, 7],
    [6, 5], [6, 6],
]);

const flappyBirdWingUpSprite2: [number, number][] = flappyBirdHeadClosedMouthSprite.concat([
    [0, 5], // straight tail
    [1, 4], [1, 5], [1, 6],
    [2, 4], [2, 5], [2, 6], [2, 7],
    [3, 4], [3, 5], [3, 6],
    [4, 6],
    [5, 6], [5, 7],
    [6, 5], [6, 6],
]);

/** DeadBirdHead. */
export class DeadBirdHead extends Actor {

    constructor(color: Color, cssPos: Vector) {
        super({
            name: 'dead-bird-head',
            pos: cssPos,
            vel: vec(Config.PipeSpeed * 0.8, 0), // *
            acc: vec(0, Config.BirdAcceleration),
            angularVelocity: 5,
            z: 2
        });
        this.graphics.use(
            xel.graphics.fromSpriteArray(flappyBirdHeadSprite, {color}));
        xel.colliders.addTo(this, flappyBirdHeadSprite);
        this.body.collisionType = CollisionType.Passive;
    }

    override onCollisionStart(_self: Collider, other: Collider): void {
        if (other.owner instanceof Ground) {
            this.vel = Vector.Zero;
            this.acc = Vector.Zero;
            this.angularVelocity = 0;
        } else if (other.owner instanceof Pipe) {
            this.vel = Vector.Zero;
        }
    }

}

/** DeadBirdBody. */
export class DeadBirdBody extends Actor {

    constructor(color: Color, cssPos: Vector) {
        super({
            name: 'dead-bird-body',
            pos: cssPos,
            acc: vec(0, Config.BirdAcceleration),
            angularVelocity: -5,
            vel: vec(-15, 0)
        });
        this.graphics.use(
            xel.graphics.fromSpriteArray(flappyBirdBodySprite, {color}));
        xel.colliders.addTo(this, flappyBirdHeadSprite);
        this.body.collisionType = CollisionType.Passive;
    }

    override onCollisionStart(_self: Collider, other: Collider): void {
        if (other.owner instanceof Ground) {
            this.vel = Vector.Zero;
            this.acc = Vector.Zero;
            this.angularVelocity = 0;
        } else if (other.owner instanceof Pipe) {
            this.vel = vec(-75, 0);
        }
    }

}

/** Bird. */
export class Bird extends Actor {

    private upAnimation!: Animation;
    private downAnimation!: Animation;

    constructor(color: Color, engine: Engine) {
        super({
            name: 'bird',
            color,
            pos: vec(
                Math.floor(engine.drawWidth / 2),
                Math.floor(engine.drawHeight / 2))
        });
        this.graphics.use(
            xel.graphics.fromSpriteArray(flappyBirdSprite, {color}));
        xel.colliders.addTo(this, flappyBirdSprite);
    }

    override onInitialize(): void {
        this.upAnimation = new Animation({
            strategy: AnimationStrategy.Loop,
            frames: [
                {
                    graphic: xel.graphics.fromSpriteArray(flappyBirdWingUpSprite2,
                        {color: this.color}),
                    duration: 30
                },
                {
                    graphic: xel.graphics.fromSpriteArray(flappyBirdWingUpSprite1,
                        {color: this.color}),
                    duration: 30
                }
            ]
        });
        this.downAnimation = new Animation({
            strategy: AnimationStrategy.Freeze,
            frames: [
                {
                    graphic: xel.graphics.fromSpriteArray(flappyBirdWingUpSprite1,
                        {color: this.color}),
                    duration: 75
                },
                {
                    graphic: xel.graphics.fromSpriteArray(flappyBirdWingUpSprite2,
                        {color: this.color}),
                    duration: 75
                },
                {
                    graphic: xel.graphics.fromSpriteArray(flappyBirdSprite,
                        {color: this.color}),
                    duration: 75
                }
            ]
        });
        this.graphics.add('up', this.upAnimation);
        this.graphics.add('down', this.downAnimation);
    }

    override onCollisionStart(_self: Collider, other: Collider): void {
        if (other.owner instanceof Ground ||
            other.owner instanceof Pipe) {
            this.ouchie();
        }
    }

    jumping = false;
    started = false;
    justStarted = false;

    private isInputActive(engine: Engine) {
        return engine.input.pointers.isDown(0);
    }

    override onPostUpdate(engine: Engine): void {
        if (!this.started) {
            return;
        }
        if (!this.jumping && (this.isInputActive(engine) || this.justStarted)) {
            this.vel.y += -800;
            this.jumping = true;
            this.justStarted = false;
            this.graphics.use('up');
            this.upAnimation.reset();
            this.downAnimation.reset();
        }
        if (!this.isInputActive(engine)) {
            this.jumping = false;
        }
        // keep velocity from getting too big
        this.vel.y = clamp(this.vel.y, -500, 500);
        // The "speed" the bird will move relative to pipes
        this.rotation = vec(200, this.vel.y).toAngle();
        if (this.vel.y > 0) {
            this.graphics.use('down');
        }
    }

    startWithAJump() {
        this.acc = vec(0, Config.BirdAcceleration);
        this.started = true;
        this.justStarted = true;
    }

    ouchie() {
        this.started = false;
        this.vel = vec(0, 0);
        this.acc = vec(0, 0);
        this.emit('bird:ouchie');
    }
}
