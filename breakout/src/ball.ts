import * as xel from '@xelly/xelly.js';
import {XellyContext} from '@xelly/xelly.js';
import {Config, GamePixelScheme} from './constants';
import {
    Actor,
    Collider,
    ColliderComponent,
    CollisionContact,
    CollisionType,
    Engine,
    Entity,
    Side,
    vec,
    Vector
} from 'excalibur';

export class Ball extends Actor {

    ballSpeed: Vector;
    colliding: boolean;
    private bricks: Entity[];
    private numBricksAlive;
    private dead = false;

    constructor(context: XellyContext, engine: Engine, bricks: Entity[]) {
        super({
            angularVelocity: Config.BallAngularVelocity,
            pos: vec(engine.drawWidth / 2, engine.drawHeight / 2),
        });
        const sprite = xel.create.circle(0, 0, Config.BallRadius_xelly);
        this.graphics.use(
            xel.graphics.fromSpriteArray(sprite, {
                color: context.color.fg,
                pixelScheme: GamePixelScheme}));
        this.collider = new ColliderComponent(xel.colliders.generate(GamePixelScheme, sprite)!);
        this.addComponent(this.collider, true);

        this.ballSpeed = Config.BallSpeed;
        this.colliding = false;
        this.body.collisionType = CollisionType.Passive;
        this.bricks = bricks;
        this.numBricksAlive = bricks.length;
    }

    start(direction: 'left' | 'right') {
        this.vel = direction === 'left' ? vec(-this.ballSpeed.x, this.ballSpeed.y) : this.ballSpeed;
    }

    stop() {
        this.vel = Vector.Zero;
        this.angularVelocity = 0;
        this.dead = true;
    }

    override onPostUpdate(engine: Engine): void {
        if (this.dead)
            return;
        // If the ball collides with the left side
        // of the screen reverse the x velocity
        if (this.pos.x < this.width / 2) {
            this.vel.x = this.ballSpeed.x;
        }

        // If the ball collides with the right side
        // of the screen reverse the x velocity
        if (this.pos.x + this.width / 2 > engine.drawWidth) {
            this.vel.x = this.ballSpeed.x * -1;
        }

        // If the ball collides with the top
        // of the screen reverse the y velocity
        if (this.pos.y < this.height / 2) {
            this.vel.y = this.ballSpeed.y;
        }

        if (this.pos.y + this.height / 2 > engine.drawHeight) {
            // this.vel.y = -this.ballSpeed.y;
            this.emit('ball:missed');
        }
    }

    override onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact) {
        if (this.bricks.indexOf(other.owner) > -1) {
            // kill removes an actor from the current scene
            // therefore it will no longer be drawn or updated
            other.owner.kill();
            if (--this.numBricksAlive === 0) {
                this.emit('no-more-bricks');
            }
        }
        // reverse course after any collision
        // intersections are the direction body A has to move to not be clipping body B
        // `ev.content.mtv` "minimum translation vector" is a vector `normalize()` will make the length of it 1
        // `negate()` flips the direction of the vector
        var intersection = contact.mtv.normalize();

        // Only reverse direction when the collision starts
        // Object could be colliding for multiple frames
        if (!this.colliding) {
            this.colliding = true;
            this.angularVelocity *= -1;
            // The largest component of intersection is our axis to flip
            if (Math.abs(intersection.x) > Math.abs(intersection.y)) {
                this.vel.x *= -1;
            } else {
                this.vel.y *= -1;
            }
        }
    }

    override onCollisionEnd(self: Collider, other: Collider, side: Side, lastContact: CollisionContact) {
        // ball has separated from whatever object it was colliding with
        this.colliding = false;
    }
}