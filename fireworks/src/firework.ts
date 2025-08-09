import { Actor, BodyComponent, Color, coroutine, CoroutineGenerator, ParticleEmitter, Random, vec, Vector } from "excalibur";

export class Firework extends Actor {
    random: Random;
    trail: ParticleEmitter;
    explosion: ParticleEmitter;
    explosion2: ParticleEmitter;
    life: number;
    body: BodyComponent;
    originalPos: Vector;
    inProgress: boolean = false;

    constructor(pos: Vector, life: number, random: Random) {
        super({ name: 'Firework' })
        this.random = random;
        this.originalPos = pos.clone();
        this.pos = pos;
        this.acc = vec(0, 200);

        this.body = new BodyComponent();
        this.life = life;

        this.trail = new ParticleEmitter({
            isEmitting: false,
            emitRate: 70,
            particle: {
                life: 1000,
                endColor: Color.White,
                beginColor: Color.White,
                minSpeed: 10,
                maxSpeed: 30,
                startSize: 3,
                endSize: 0,
                fade: true,
                acc: vec(0, 50),
            }
        });

        this.explosion = new ParticleEmitter({
            isEmitting: false,
            particle: {
                life: 2000,
                fade: true,
                startSize: 5,
                endSize: 2,
                minSpeed: 10,
                maxSpeed: 200,
                acc: vec(0, 100),
                beginColor: this.randomColor(),
                endColor: this.randomColor()
            }
        });
        this.explosion2 = new ParticleEmitter({
            isEmitting: false,
            particle: {
                life: 1000,
                fade: true,
                startSize: 5,
                endSize: 2,
                minSpeed: 10,
                maxSpeed: 200,
                acc: vec(0, 100),
                beginColor: this.randomColor(),
                endColor: this.randomColor()
            }
        });

        this.addChild(this.trail);
        this.addChild(this.explosion);
        this.addChild(this.explosion2);
    }

    private _colors = [
        Color.fromHex("#ff0000"),
        Color.fromHex("#0078ff"),
        Color.fromHex("#ffffff"),
        Color.fromHex("#d059c5"),
        Color.fromHex("#dff241"),
        Color.fromHex("#05ff1c"),
        Color.fromHex("#ffdf00"),
        Color.fromHex("#3e00f9"),
        Color.fromHex("#ff5fc0"),
        Color.fromHex("#ff3f3f"),
        Color.fromHex("#f66706"),
    ]

    private randomColor(): Color {
        return this.random.pickOne(this._colors);
    }

    launch() {
        if (this.inProgress) return;
        this.inProgress = true;
        this.pos = this.originalPos;

        coroutine(this.scene!.engine, (function*(this: Firework) {
            this.vel = vec(this.random.floating(-100, 100), this.random.floating(-200, -400));
            this.trail.isEmitting = true;
            let hasExploded = false;
            let life = this.life;
            while (life > 0) {
                const elapsed = yield;
                life -= elapsed;
                if (this.vel.y >= 0 && !hasExploded) {
                    hasExploded = true;
                    this.trail.isEmitting = false;
                    this.explosion.emitParticles(500);
                    this.explosion2.emitParticles(500);
                }
            }
            this.trail.clearParticles();
            this.explosion.clearParticles();
            this.explosion2.clearParticles();
            this.inProgress = false;
        } as CoroutineGenerator).bind(this))
    }

}
