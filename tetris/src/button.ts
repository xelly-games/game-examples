import {
    Actor,
    Color,
    Font, FontUnit, Graphic,
    Label,
    Rectangle,
    Sprite,
    vec,
    Vector
} from 'excalibur';

/*
export const font_ = (color: Color, size: number) => {
    return new Font({
        color,
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        unit: FontUnit.Px,
        size
    });
};

export class TextButton extends Label {

    constructor(themeColor: Color, text: string, font: Font, padding: Vector) {
        super({
            anchor: Vector.Zero
        });
        const m = font.measureText(text);
        this.graphics.use(new Rectangle({
            width: m.width + padding.x * 2,
            height: m.height + padding.y * 2,
            // strokeColor: themeColor,
            color: themeColor,
            // lineWidth: 2
        }));
        this.addChild(new Label({
            text,
            font,
            color: Color.White,
            pos: vec(padding.x, padding.y),
            anchor: Vector.Zero
        }));
    }

}
 */

export class Button extends Label {

    private readonly child: Actor;
    private handler?: () => void;

    constructor(themeColor: Color, graphic: Graphic, graphicDepressed: Graphic,
                totalPadding: { top: number, left: number, right: number, bottom: number }) {
        super({
            anchor: Vector.Zero,
            z: 25,
        });
        this.graphics.use(new Rectangle({
            width: graphic.width + totalPadding.left + totalPadding.right,
            height: graphic.height + totalPadding.top + totalPadding.bottom,
            strokeColor: Color.Transparent,
            color: Color.Transparent,
            lineWidth: 2
        }));
        this.child = new Actor({
            anchor: Vector.Zero,
            z: 50
        });
        this.child.pos = vec(totalPadding.left, totalPadding.top);
        this.child.graphics.add(graphic);
        this.child.graphics.add('depressed', graphicDepressed);
        this.child.graphics.use('default');
        this.addChild(this.child);
        let delay: number | undefined;
        let interval: number | undefined;
        this.on('pointerdown', () => {
            this.child.graphics.use('depressed');
            this.handler?.();
            delay = setTimeout(() => {
                interval = setInterval(() => {
                    this.handler?.();
                }, 75);
            }, 250);
        });
        this.on('pointerup', () => {
            this.child.graphics.use('default');
            if (delay) {
                clearTimeout(delay);
            }
            if (interval) {
                clearInterval(interval);
            }
        });
    }

    setHandler(handler: () => void) {
        this.handler = handler;
    }

}
