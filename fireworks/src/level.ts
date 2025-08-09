import { Color, Engine, Random, Scene, Timer, vec } from "excalibur";
import { Firework } from './firework';

export class MyLevel extends Scene {
    timer!: Timer;

    constructor() {
        super();
        this.backgroundColor = Color.fromHex('#0a0a0a'); // Color.Black;
    }

    override onInitialize(engine: Engine): void {
        const random = new Random(1337);

        const fireworks: Firework[] = [];
        for (let i = 0; i < 20; i++) {
            const firework = new Firework(vec(engine.drawWidth / 2, engine.drawHeight), 4000, random);
            fireworks.push(firework);
            this.add(firework);
        }
        let currentFireworkIndex = 0;
        const launch = () => {
            fireworks[currentFireworkIndex].launch();
            currentFireworkIndex = (currentFireworkIndex + 1) % fireworks.length;
        };

        this.input.pointers.on('down', launch);

        this.timer = new Timer({
            action: launch,
            interval: 1500,
            repeats: true
        });
        this.add(this.timer);
        this.timer.start();
    }
}
