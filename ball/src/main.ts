import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    Actor,
    CollisionType,
    Color,
    Engine,
    Shape,
    SolverStrategy,
    vec,
    Vector
} from 'excalibur';
import {ballImageSource} from './ball';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Interactive,
    deps: ['dictionary']
};

const makeDraggable__ = (engine: Engine, actor: Actor) => {
    let mostRecentPos = vec(0, 0);
    let prevPos: Vector = vec(0, 0);
    let diff: Vector = vec(0, 0);
    let prevPosTimeMs: number | undefined;
    let currDragVel: Vector = vec(0, 0);
    let dragOffset: Vector | undefined;
    actor.on('pointerdragstart', (event) => {
        // actor.body.isSleeping = true;
        if (!dragOffset) {
            actor.pos.clone(prevPos);
            prevPosTimeMs = Date.now();
            dragOffset = event.screenPos.sub(actor.pos);
            actor.body.collisionType = CollisionType.PreventCollision;
        }
    });
    const maybeUpdateDragVelocity = () => {
        const epoch = Date.now();
        const msSinceLastPos = epoch - prevPosTimeMs!;
        if (msSinceLastPos > 25) {
            actor.pos.sub(prevPos!, diff);
            currDragVel.setTo((1000 * diff.x) / msSinceLastPos, (1000 * diff.y) / msSinceLastPos);
            actor.pos.clone(prevPos);
            prevPosTimeMs = Date.now();
        }
    };
    const up_ = () => {
        actor.body.collisionType = CollisionType.Active;
        if (dragOffset) {
            maybeUpdateDragVelocity();
            if (currDragVel) {
                actor.vel = currDragVel;
            }
            dragOffset = undefined;
            prevPos.x = 0;
            prevPos.y = 0;
            prevPosTimeMs = undefined;
            dragOffset = undefined;
            currDragVel.x = 0;
            currDragVel.y = 0;
            mostRecentPos.x = 0;
            mostRecentPos.y = 0;
        }
        //actor.body.isSleeping = false;
    };
    actor.on('pointerdragend', up_);
    engine.input.pointers.primary.on('up', up_);
    engine.input.pointers.primary.on('move', event => {
        if (dragOffset) {
            const candidatePos = event.screenPos.sub(dragOffset);
            const fudge = 10;
            if (candidatePos.x - actor.width / 2 - fudge < 0
                || candidatePos.x + actor.width / 2 + fudge > engine.drawWidth
                || candidatePos.y - actor.width / 2 - fudge < 0
                || candidatePos.y + actor.width / 2 + fudge > engine.drawHeight) {
                actor.pos = mostRecentPos;
                return;
            }
            actor.pos = candidatePos;
            mostRecentPos = candidatePos;
            maybeUpdateDragVelocity();
        }
    });
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const dict = context.deps!['dictionary'] as any;
    const word = dict[Math.floor(Math.random() * dict.length)];
    console.log(word);

    engine.physics.solver = SolverStrategy.Realistic;
    engine.physics.gravity = vec(0, 800);

    const targetDim = 75;

    ballImageSource.load().then(() => {
        const sprite = ballImageSource.toSprite();
        sprite.scale = vec(targetDim / sprite.width, targetDim / sprite.height);
        const defaultBallPos = vec(engine.halfDrawWidth, Math.floor(sprite.height / 2));
        const ball = new Actor({
            pos: defaultBallPos,
            z: 10,
            collisionType: CollisionType.Active
        });
        ball.body.bounciness = 0.8;
        ball.body.friction = 0.5;
        //ball.body.limitDegreeOfFreedom.push(DegreeOfFreedom.Rotation);
        ball.graphics.use(sprite);
        const useRadius = Math.floor((sprite.height - 25) / 2);
        ball.collider.set(Shape.Circle(useRadius));
        makeDraggable__(engine, ball);
        engine.add(ball);

        let stillFrames = 0;
        ball.on('postupdate', () => {
            stillFrames = ball.vel.magnitude < 15 ? stillFrames + 1 : 0;
            if (stillFrames > 30) {
                ball.body.vel = Vector.Zero;
                //ball.body.isSleeping = true;
            }
        });

        const sandHeight = 25;
        const waterHeight = 50;

        engine.add(new Actor({ // sky
            anchor: Vector.Zero,
            pos: vec(0, 0),
            width: engine.drawWidth,
            height: engine.drawHeight,
            color: Color.fromHex('#B0E2FF'),
            collisionType: CollisionType.Passive
        }));
        engine.add(new Actor({ // beach
            anchor: Vector.Zero,
            pos: vec(0, engine.drawHeight - sandHeight - waterHeight),
            width: engine.drawWidth,
            height: waterHeight,
            color: Color.fromHex('#1CA9C9'),
            collisionType: CollisionType.PreventCollision
        }));

        engine.add(new Actor({ // water
            anchor: Vector.Zero,
            pos: vec(0, engine.drawHeight - sandHeight),
            width: engine.drawWidth,
            height: sandHeight,
            color: Color.fromHex('#F5DEB3'),
            collisionType: CollisionType.Fixed
        }));
        engine.add(new Actor({ // left wall
            anchor: Vector.Zero,
            pos: vec(0, -5),
            width: engine.drawWidth,
            height: 5,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed
        }));
        engine.add(new Actor({ // left wall
            anchor: Vector.Right,
            pos: vec(0, 0),
            width: 5,
            height: engine.drawHeight,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed
        }));
        engine.add(new Actor({ // right wall
            anchor: Vector.Zero,
            pos: vec(engine.drawWidth, 0),
            width: 5,
            height: engine.drawHeight,
            color: Color.Transparent,
            collisionType: CollisionType.Fixed
        }));
    });
};
