import {Actor, Color, Graphic, Rectangle, vec, Vector} from 'excalibur';
import * as xel from '@xelly/xelly.js';
import {Config} from './constants';

type LetterInfo = {
    char: string,
    graphic: Graphic,
    pickedGraphic: Graphic
};

type Letters = {
    maxHeight: number,
    maxWidth: number,
    letters: LetterInfo[]
};

const createLetters = (themeColor: Color, padding: Vector = Config.PickerLetterPadding): Letters => {
    const letters: LetterInfo[] = [];
    let maxHeight = -1;
    let maxWidth = -1;
    for (let i = 65; i <= 90; i++) { // upper case letters
        const char = String.fromCharCode(i);
        const graphic
            = xel.graphics.fromSpriteArray(xel.create.label(char, {/*font: 'font2'*/}),
            {
                color: themeColor,
                cssWidthAndHeightOverride: dim => dim.add(padding)
            });
        const pickedGraphic
            = xel.graphics.fromSpriteArray(xel.create.label(char, {/*font: 'font2'*/}),
            {
                color: themeColor.clone().lighten(0.8),
                cssWidthAndHeightOverride: dim => dim.add(padding)
            });
        letters.push({
            char,
            graphic,
            pickedGraphic
        });
        maxHeight = Math.max(maxHeight, graphic.height);
        maxWidth = Math.max(maxWidth, graphic.width);
    }
    return {
        maxHeight,
        maxWidth,
        letters
    };
}

export class LetterPicker extends Actor {

    public readonly totalHeightFirstTwoRows: number;

    constructor(themeColor: Color, private maxWidth: number) {
        super({anchor: Vector.Zero, color: themeColor});
        const letters = createLetters(this.color);
        const rows: Actor[] = [];
        const rowWidths: number[] = [];
        let currentRow = new Actor({anchor: Vector.Zero});
        let currentOffsetX = 0;
        for (let letter of letters.letters) {
            if (currentOffsetX + letter.graphic.width > this.maxWidth) {
                rows.push(currentRow);
                rowWidths.push(currentOffsetX - Config.PickerLetterSpacingX);
                currentOffsetX = 0;
                currentRow = new Actor({anchor: Vector.Zero});
                currentOffsetX = 0;
            }
            const actor = new Actor({
                anchor: Vector.Zero,
                pos: vec(currentOffsetX, 0),
                // set width + height to get a collider for touch interactions:
                width: letter.graphic.width,
                height: letter.graphic.height,
            });
            actor.graphics.use(letter.graphic);
            actor.graphics.add('picked', letter.pickedGraphic);
            currentRow.addChild(actor);
            const clickHandler = (e: any) => {
                actor.off('pointerdown', clickHandler);
                actor.graphics.use('picked');
                this.emit('picker:select', letter.char);
            };
            actor.on('pointerdown', clickHandler);
            currentOffsetX += letter.graphic.width + Config.PickerLetterSpacingX;
        }
        if (currentOffsetX > 0) {
            rows.push(currentRow);
            rowWidths.push(currentOffsetX - Config.PickerLetterSpacingX);
        }
        for (let i = 0; i < rows.length; i++) {
            const theRow = rows[i];
            theRow.pos.x = Math.round((this.maxWidth - rowWidths[i]) / 2);
            theRow.pos.y = i * (letters.maxHeight + Config.PickerLetterSpacingY);
            this.addChild(theRow);
        }
        this.totalHeightFirstTwoRows = letters.maxHeight * 2
            + Config.PickerLetterSpacingY;
        // in this case, this is how clients of this class can get the overall
        //  bounds -- i.e., via letterPicker.graphics.current!.width etc.
        this.graphics.use(new Rectangle({
            // for debugging:
            // strokeColor: Color.Red,
            // lineWidth: 1,
            color: Color.Transparent,
            width: this.maxWidth,
            height: letters.maxHeight * rows.length + Config.PickerLetterSpacingY * (rows.length - 1)
        }));
    }

    totalHeight() {
        return this.graphics.current!.height;
    }

    totalWidth() {
        return this.graphics.current!.width;
    }

}
