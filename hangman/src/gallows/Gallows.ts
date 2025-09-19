import {Actor, Color, GraphicsGroup, Line, vec, Vector} from 'excalibur';
import {SizingRatios, Sizings} from './sizing';
import {Hangman} from './Hangman';

export class Gallows extends Actor {

    private readonly sizings: Sizings;
    public readonly hangman: Hangman;

    constructor(themeColor: Color, public maxWidth: number, private maxHeight: number, hardMode: boolean = false) {
        super({anchor: Vector.Zero, color: themeColor});
        const baseWidth = Math.round(this.maxWidth * SizingRatios.BaseWidthPercent);
        const uprightHeight = this.maxHeight;
        const dropHeight = Math.round(this.maxHeight * SizingRatios.CrossBeamDropHeightPercent);
        this.sizings = {
            thickness: 6,
            baseWidth,
            uprightHeight,
            dropHeight,
            crossBeamWidth: Math.round(this.maxWidth * SizingRatios.CrossBeamWidthPercent),
            crossBeamOffsetX: Math.round(baseWidth / 2),
            totalBelowDropHeight: uprightHeight - dropHeight,
            headWidth: this.maxWidth * SizingRatios.BodyWidthPercent
        };
        this.graphics.use(this.createStructureGraphic());
        this.hangman = new Hangman({
            color: themeColor,
            pos: vec(this.sizings.crossBeamOffsetX + this.sizings.crossBeamWidth
                + Math.floor(this.sizings.thickness / 2),
                this.sizings.dropHeight - Math.floor(this.sizings.thickness / 2))
        }, this.sizings, hardMode);
        this.addChild(this.hangman);
    }

    createStructureGraphic() {
        const color = this.color;
        const thickness = this.sizings.thickness;
        const start = vec(0, 0);
        return new GraphicsGroup({
            members: [
                { // base
                    graphic: new Line({
                        color, thickness, start,
                        end: vec(this.sizings.baseWidth, 0)
                    }),
                    offset: vec(0, this.maxHeight)
                },
                { // upright
                    graphic: new Line({
                        color, thickness, start,
                        end: vec(0, this.sizings.uprightHeight)
                    }),
                    offset: vec(this.sizings.crossBeamOffsetX, 0)
                },
                { // crossbeam
                    graphic: new Line({
                        color, thickness, start,
                        end: vec(this.sizings.crossBeamWidth, 0)
                    }),
                    offset: vec(this.sizings.crossBeamOffsetX, Math.round(thickness / 2))
                },
                { // drop
                    graphic: new Line({
                        color, thickness, start,
                        end: vec(0, this.sizings.dropHeight)
                    }),
                    offset: vec(this.sizings.crossBeamOffsetX +
                        this.sizings.crossBeamWidth + Math.round(thickness / 2), 0)
                },
            ]
        });
    }

}
