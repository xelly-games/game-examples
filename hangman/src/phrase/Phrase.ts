import {Actor, Color, Line, Rectangle, vec, Vector} from 'excalibur';
import {determineMaxLetterWidth, layoutPhrase} from './layout';

const sleep = (ms: number) =>
    new Promise(r => setTimeout(r, ms));

export class Phrase extends Actor {

    readonly orderedPlaceholderActors: Actor[] = [];
    readonly letterToPlaceholderActors = new Map<string, Actor[]>();
    readonly letterToAnswerActors = new Map<string, Actor[]>();

    constructor(private phrase: string, themeColor: Color, private maxWidth: number) {
        super({anchor: Vector.Zero, color: themeColor});
        this.layout(this.phrase);
    }
    
    async runInitialRevealPlaceholdersAnimation() {
        for (let i = 0; i < this.orderedPlaceholderActors.length; i++) {
            const placeholder = this.orderedPlaceholderActors[i];
            placeholder.graphics.isVisible = true;
            if (i < this.orderedPlaceholderActors.length - 1) {
                await sleep(50);
            }
        }
        const blinkPromises: Promise<void>[] = [];
        this.orderedPlaceholderActors.forEach(placeholder => {
            blinkPromises.push(
                placeholder.actions.blink(75, 50, 2)
                    .toPromise());
        });
        return Promise.all(blinkPromises);
    }

    revealAllLetters() {
        for (const [key, val] of this.letterToPlaceholderActors.entries()) {
            for (let spot of val) {
                this.removeChild(spot);
            }
        }
        for (const [key, val] of this.letterToAnswerActors.entries()) {
            for (let spot of val) {
                this.addChild(spot);
            }
        }
    }

    /** @returns true if the provided letter was revealed in the phrase. */
    chooseLetter(letter: string): boolean {
        const pSpots = this.letterToPlaceholderActors.get(letter as string);
        const aSpots = this.letterToAnswerActors.get(letter as string);
        if (pSpots && aSpots) {
            for (let spot of pSpots) {
                this.removeChild(spot);
            }
            for (let spot of aSpots) {
                this.addChild(spot);
            }
            this.letterToPlaceholderActors.delete(letter as string);
            this.letterToAnswerActors.delete(letter as string);
            if (this.letterToPlaceholderActors.size <= 0) {
                this.emit('phrase:complete');
            }
            return true;
        } else {
            return false;
        }
    }

    private layout(phrase: string) {
        const layout = layoutPhrase(phrase, this.color, this.maxWidth);
        const maxLetterWidth = determineMaxLetterWidth();
        let maxX = -1, maxY = -1;
        for (let placement of layout) {
            const psw = maxLetterWidth;
            const psh = placement.graphic.height;
            const underscoreGraphic = new Line({
                color: this.color,
                thickness: 3,
                start: vec(0, psh),
                end: vec(psw, psh)
            });
            const underscoreActor = new Actor({
                anchor: Vector.Zero,
                x: placement.x,
                y: placement.y
            });
            underscoreActor.graphics.use(underscoreGraphic);
            const answerActor = new Actor({
                anchor: Vector.Zero,
                x: placement.x + (psw - placement.graphic.width) / 2,
                y: placement.y
            });
            answerActor.graphics.use(placement.graphic);
            maxX = Math.max(maxY, placement.x + psw);
            maxY = Math.max(maxY, placement.y + psh);
            if (!placement.show) {
                if (!this.letterToPlaceholderActors.has(placement.letter))
                    this.letterToPlaceholderActors.set(placement.letter, []);
                this.letterToPlaceholderActors.get(placement.letter)!.push(underscoreActor);
                if (!this.letterToAnswerActors.has(placement.letter))
                    this.letterToAnswerActors.set(placement.letter, []);
                this.letterToAnswerActors.get(placement.letter)!.push(answerActor);
                this.orderedPlaceholderActors.push(underscoreActor);
                underscoreActor.graphics.isVisible = false;
                underscoreActor.graphics.opacity = 1;
                this.addChild(underscoreActor);
            } else {
                this.addChild(answerActor);
            }
            // in this case, this is how clients of this class can get the overall
            //  bounds -- i.e., via letterPicker.graphics.current!.width etc.
            this.graphics.use(new Rectangle({
                // for debugging:
                // strokeColor: Color.Red,
                // lineWidth: 4,
                color: Color.Transparent,
                width: this.maxWidth,
                height: maxY
            }));
        }
    }

    totalHeight() {
        return this.graphics.current!.height;
    }

    totalWidth() {
        return this.graphics.current!.width;
    }

}
