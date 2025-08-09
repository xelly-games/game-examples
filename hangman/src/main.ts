import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellySpriteActor
} from '@xelly/xelly.js';
import {Actor, Engine, vec, Vector} from 'excalibur';
import {HangmanActor, HangmanWidth} from './man';
//import {idioms} from './easy-idioms';
import {words} from './hard-words';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased,
    forkable: false
};

const gallowsOffsetXPercent = 0.05;
const gallowsOffsetYPercent = 0.25;
const gallowsBaseWidthPercent = 0.20;
const gallowsHeightPercent = 0.65;
const gallowsHorizontalPercentOfBase = 0.75;
const gallowsTotalWidthPercent = (0.5 + gallowsHorizontalPercentOfBase) * gallowsBaseWidthPercent;
const gallowsDropPercentOfHeight = 0.15;

const phraseWindowMarginLeftPercent = 0.10;
const phraseWindowMarginRightPercent = 0.05;

const makeGallows = (context: XellyContext) => {
    const height = Math.round(context.screen.pixel.height * gallowsHeightPercent);
    const baseWidth = Math.round(context.screen.pixel.width * gallowsBaseWidthPercent);
    const offsetx = Math.round(context.screen.pixel.width * gallowsOffsetXPercent);
    const offsety = Math.round(context.screen.pixel.height * gallowsOffsetYPercent);

    const base = xel.create.line(0, 0, baseWidth, 0);
    const upright = xel.create.line(0, 0, 0, height);
    const horizontal = xel.create.line(0, 0, Math.round(baseWidth * gallowsHorizontalPercentOfBase), 0);
    const drop = xel.create.line(0, 0, 0, Math.round(height * gallowsDropPercentOfHeight));

    const assembled = xel.shift.y(base, height)
        .concat(xel.shift.x(upright, Math.round(baseWidth / 2)))
        .concat(xel.shift.x(horizontal, Math.round(baseWidth / 2)))
        .concat(xel.shift.x(drop, Math.round(baseWidth / 2) + xel.measure.width(horizontal)));

    return xel.shift.x(
        xel.shift.y(assembled, offsety), offsetx);
};

const computePhraseWindowDimensions = (context: XellyContext) => {
    const phraseWindowWidth =
        Math.round((1 - (gallowsOffsetXPercent + gallowsTotalWidthPercent + phraseWindowMarginLeftPercent + phraseWindowMarginRightPercent))
            * context.screen.pixel.width);
    const phraseWindowHeight = Math.round(gallowsHeightPercent * context.screen.pixel.height);
    return [phraseWindowWidth, phraseWindowHeight];
};

const computePhraseWindowOffset = (context: XellyContext) => {
    return [
        (gallowsOffsetXPercent + gallowsTotalWidthPercent + phraseWindowMarginLeftPercent) * context.screen.pixel.width,
        gallowsOffsetYPercent * context.screen.pixel.height
    ];
};

const createPhraseWindowActor = (context: XellyContext) => {
    const [phraseWindowWidth, phraseWindowHeight] = computePhraseWindowDimensions(context);
    const [phraseWindowX, phraseWindowY] = computePhraseWindowOffset(context);
    return xel.actors.fromSprite(context, xel.create.rect(0, 0, phraseWindowWidth, phraseWindowHeight), {},
        xel.actorArgs.fromPixelBasedArgs(context, {
            anchor: Vector.Zero,
            x: phraseWindowX,
            y: phraseWindowY
        }));
};

type Placement = {
    x: number,
    y: number,
    sprite: [number, number][],
    letter: string,
    show: boolean
};

type Line = {
    wordLetters: string[][],
    wordSprites: [number, number][][][],
    hypenate: boolean
};

const MaxLetterWidth = xel.measure.width(xel.create.label('W'));

const layoutPhrase = (context: XellyContext, phrase: string) => {
    const vspacing = 5;
    const [phraseWindowWidth, phraseWindowHeight] = computePhraseWindowDimensions(context);

    const hyphenSprite = xel.create.label('-', {/*font: 'font2'*/});
    const useSpaceWidth = Math.ceil(xel.measure.width(hyphenSprite) * 1.5);

    const words = phrase.trim().split(/\s+/);
    const lines: Line[] = [];
    let currentLine: Line = {
        wordLetters: [[]],
        wordSprites: [[]],
        hypenate: false
    };
    let currentLineWidth = 0;
    let currentTotalHeight = 0;
    let currentLineHeight = 0;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (const letter of word) {
            const letterSprite = xel.create.label(letter, {/*font: 'font2'*/});
            const letterSpriteWidth = xel.measure.width(letterSprite);
            currentLineHeight = xel.measure.height(letterSprite); // assume all letters same height
            if (currentLineWidth + /*letterSpriteWidth*/MaxLetterWidth + 1 > phraseWindowWidth) {
                if (currentLine.wordLetters.length === 1) {
                    // line only has one word but that word can't fit so we'll have
                    // to hyphenate it
                    currentLine.hypenate = true;
                    lines.push(currentLine);
                    currentTotalHeight += currentLineHeight + vspacing;
                    currentLine = {
                        wordLetters: [[letter]],
                        wordSprites: [[letterSprite]],
                        hypenate: false
                    };
                    currentLineWidth = /*letterSpriteWidth*/MaxLetterWidth;
                } else {
                    const nextWordLetters = [[...currentLine.wordLetters.pop() as string[], letter]];
                    const nextWordSprites = [[...currentLine.wordSprites.pop() as [number, number][][], letterSprite]];
                    lines.push(currentLine); // after ^mutations
                    currentTotalHeight += currentLineHeight + vspacing;
                    currentLine = {
                        wordLetters: nextWordLetters,
                        wordSprites: nextWordSprites,
                        hypenate: false
                    };
                    currentLineWidth = 0;
                    for (let wordSprite of nextWordSprites) {
                        for (let wordSpriteLetter of wordSprite) {
                            currentLineWidth += /*xel.measure.width(wordSpriteLetter)*/MaxLetterWidth + 1;
                        }
                    }
                }
            } else {
                currentLine.wordLetters[currentLine.wordLetters.length - 1].push(letter);
                currentLine.wordSprites[currentLine.wordLetters.length - 1].push(letterSprite);
                currentLineWidth += /*xel.measure.width(letterSprite)*/MaxLetterWidth + 1;
            }
        }
        if (i < words.length - 1) { // more words are coming
            currentLineWidth += useSpaceWidth;
            currentLine.wordLetters.push([]);
            currentLine.wordSprites.push([]);
        } else { // no more words
            if (currentLine.wordLetters.length > 0) {
                lines.push(currentLine);
                currentTotalHeight += currentLineHeight + vspacing;
                currentLine = {
                    wordLetters: [[]],
                    wordSprites: [[]],
                    hypenate: false
                };
            }
        }
    }

    const layout: Placement[] = [];
    let totalHeight = 0;
    for (let line of lines) {
        totalHeight += xel.measure.height(line.wordSprites[0][0]) + vspacing;
    }
    if (totalHeight > phraseWindowHeight) {
        throw new Error('phrase too long/big for view');
    }
    const layoutOffsetY/*within phrase window*/ =
        Math.floor((phraseWindowHeight - totalHeight) / 2);
    let currentOffsetY = layoutOffsetY;
    for (let line of lines) {
        let lineWidth = 0;
        for (let i = 0; i < line.wordLetters.length; i++) {
            const oneWordSprites = line.wordSprites[i];
            for (let oneWordLetterSprite of oneWordSprites) {
                lineWidth += /*xel.measure.width(oneWordLetterSprite)*/MaxLetterWidth + 1;
            }
            if (i < line.wordLetters.length - 1) {
                lineWidth += useSpaceWidth;
            }
        }
        if (line.hypenate) {
            lineWidth += xel.measure.width(hyphenSprite);
        }
        const lineOffsetX = Math.floor((phraseWindowWidth - lineWidth) / 2);
        let currentOffsetX = lineOffsetX;
        for (let i = 0; i < line.wordLetters.length; i++) {
            const oneWordSprites = line.wordSprites[i];
            for (let j = 0; j < oneWordSprites.length; j++) {
                const oneWordLetterSprite = oneWordSprites[j];
                //     x: number, y: number, sprite: number[][], letter: string, show: boolean
                layout.push({
                    x: currentOffsetX,
                    y: currentOffsetY,
                    sprite: oneWordLetterSprite,
                    letter: line.wordLetters[i][j],
                    show: !(/^[A-Z]$/.test(line.wordLetters[i][j]))
                });
                currentOffsetX += /*xel.measure.width(oneWordLetterSprite)*/MaxLetterWidth + 1;
            }
            if (i < line.wordLetters.length - 1) {
                // end of word, add space
                currentOffsetX += useSpaceWidth;
            }
        }
        if (line.hypenate) {
            layout.push({
                x: currentOffsetX,
                y: currentOffsetY,
                sprite: hyphenSprite,
                letter: '-',
                show: true
            });
        }
        currentOffsetY += xel.measure.height(line.wordSprites[0][0]) + vspacing;
    }
    return layout;
};

// --

const letterPickerXMarginPercent = 0.05;
const letterPickerXOffsetPercent = letterPickerXMarginPercent;
const letterPickerWidthPercent = 1 - letterPickerXMarginPercent * 2;
const letterPickerHSpacing = 2;
const letterPickerVSpacing = 4;
const letterWidthMultiplier = 1.5;

class LetterPicker extends XellySpriteActor {

    constructor(context: XellyContext) {
        super(xel.actorArgs.fromPixelBasedArgs(context, {
            anchor: Vector.Zero,
            x: Math.round(letterPickerXOffsetPercent * context.screen.pixel.width),
            y: letterPickerVSpacing
        }), context, [], {});
    }

    override onInitialize(engine: Engine): void {
        let currXOffset = 0;
        let currYOffset = 0;

        let letterHeight = -1;
        let maxLetterHeight = -1;
        let maxLetterWidth = -1;
        const uppers: [string, [number, number][]][] = [];
        for (let i = 65; i <= 90; i++) { // upper case letters
            const upperLetter = String.fromCharCode(i);
            const sprite = xel.create.label(upperLetter, {/*font: 'font2'*/});
            uppers.push([upperLetter, sprite]);
            letterHeight = xel.measure.height(sprite);
            maxLetterHeight = Math.max(xel.measure.height(sprite), maxLetterHeight);
            maxLetterWidth = Math.max(xel.measure.width(sprite), maxLetterWidth);
        }
        let currentRowNumberOfCharactersCreated = 0;
        for (let i = 0; i < uppers.length; i++) {
            if (currXOffset > this.context.screen.pixel.width * letterPickerWidthPercent) {
                const isLastRow =
                    (uppers.length - i) <= currentRowNumberOfCharactersCreated;
                if (isLastRow) {
                    let lastRowWidth = 0;
                    for (let j = i; j < uppers.length; j++) {
                        lastRowWidth += /*xel.measure.width(uppers[j][1])*/maxLetterWidth * letterWidthMultiplier + (j === uppers.length - 1 ? 0 : letterPickerHSpacing);
                    }
                    currXOffset = Math.round((this.context.screen.pixel.width * letterPickerWidthPercent - lastRowWidth) / 2);
                } else {
                    currXOffset = 0;
                }
                currYOffset += letterHeight + letterPickerVSpacing;
                currentRowNumberOfCharactersCreated = 0;
            }
            const actor = new Actor(xel.actorArgs.fromPixelBasedArgs(this.context, {
                anchor: Vector.Zero,
                x: currXOffset,
                y: currYOffset,
                // explicit width + height creates a collider that means
                //  user can select letter w/o needing precise touch on visible
                width: maxLetterWidth * letterWidthMultiplier,
                height: maxLetterHeight,
            }));
            let gOptions = {
                spritePadding: vec(((maxLetterWidth * letterWidthMultiplier - xel.measure.width(uppers[i][1])) / 2), 0),
                // fgColor: 'negative' as const,
                // fgAlpha: 0.3,
                // bgColor: 'positive' as const,
                // bgAlpha: 1,
                positioning: {
                    anchor: Vector.Half,
                    fractionalOffset: Vector.Half
                }
            };
            actor.graphics.add(xel.graphics.fromSprite(this.context, uppers[i][1], gOptions));
            actor.graphics.add('picked', xel.graphics.fromSprite(this.context, uppers[i][1], {fgAlpha: 0.3, ...gOptions}));
            this.addChild(actor);
            const clickHandler = (e: any) => {
                actor.off('pointerdown', clickHandler);
                actor.graphics.use('picked');
                this.emit('picker:select', uppers[i][0]);
            };
            actor.on('pointerdown', clickHandler);
            currXOffset += /*xel.measure.width(uppers[i][1])*/maxLetterWidth * letterWidthMultiplier + letterPickerHSpacing;
            ++currentRowNumberOfCharactersCreated;
        }
    }

}

// --

// -- context.parameters --

const readPuzzlePhraseFromContextConfig = (context: XellyContext) => {
    if (context.parameters?.gameConfig && context.parameters?.gameConfig.trim()) {
        // NOTE !!!
        //   (1) if we have a game config we are going to assume it provides us the static
        //       word to use -- this makes this game technically NON-replayable -- so we
        //       will insert this game into db with a parseable config and
        //       replayable = false.
        //   (2) for now we are going to let parsing fail-fast if the config is bad (non-json)
        //       and does not conform to the config we expect (i.e, has a word property w/ 5-letter
        //       value)
        const parsed = JSON.parse(context.parameters.gameConfig);
        if (typeof parsed.phrase === 'string') {
            return parsed.phrase.toUpperCase();
        } else {
            throw new Error(`bad game config: ${context.parameters.gameConfig}`);
        }
    }
    return undefined;
};

type TerminationGameState = {
    usedLetters: string[]
};

const toTerminationResult = (usedLetters: string[]) => {
    const payload: TerminationGameState = {
        usedLetters
    };
    return JSON.stringify(payload);
};

const readGameStateFromContextParameters = (context: XellyContext) => {
    if (context.parameters?.userGameState && context.parameters?.userGameState.trim()) {
        const theGameState = context.parameters.userGameState.trim();
        try {
            return JSON.parse(theGameState) as TerminationGameState;
        } catch (e) {
            console.warn("couldn't parse game state", e);
            return undefined;
        }
    }
    return undefined;
};

// --

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const phrase = readPuzzlePhraseFromContextConfig(context)
        || words[Math.floor(Math.random() * words.length)].toUpperCase();
    const userGameState = readGameStateFromContextParameters(context);
    const suppressAnimations = userGameState !== undefined;
    // --
    const gallows = makeGallows(context);
    engine.add(xel.actors.fromSprite(context, gallows, {},
        xel.actorArgs.fromPixelBasedArgs(context,
            {
                anchor: Vector.Zero
            })));
    // --
    // engine.add(createPhraseWindowActor(context));
    // --

    const letterPicker = new LetterPicker(context);
    engine.add(letterPicker);

    // --
    const layout = layoutPhrase(context, phrase);
    const [phraseWindowX, phraseWindowY] = computePhraseWindowOffset(context);
    const letterToPlaceholderActors = new Map<string, Actor[]>();
    const letterToAnswerActors = new Map<string, Actor[]>();
    for (let placement of layout) {
        const psw = /*xel.measure.width(placement.sprite)*/MaxLetterWidth;
        const psh = xel.measure.height(placement.sprite);
        const underscore = xel.create.line(0, psh, psw - 1, psh);
        const actor = xel.actors.fromSprite(
            context,
            underscore,
            {},
            xel.actorArgs.fromPixelBasedArgs(context, {
                anchor: Vector.Zero,
                x: phraseWindowX + placement.x,
                y: phraseWindowY + placement.y
            }));
        const answerActor = xel.actors.fromSprite(
            context,
            placement.sprite,
            {},
            xel.actorArgs.fromPixelBasedArgs(context, {
                anchor: Vector.Zero,
                x: phraseWindowX + placement.x + (psw - xel.measure.width(placement.sprite)) / 2,
                y: phraseWindowY + placement.y
            }));
        if (!placement.show) {
            if (!letterToPlaceholderActors.has(placement.letter))
                letterToPlaceholderActors.set(placement.letter, []);
            letterToPlaceholderActors.get(placement.letter)!.push(actor);
            if (!letterToAnswerActors.has(placement.letter))
                letterToAnswerActors.set(placement.letter, []);
            letterToAnswerActors.get(placement.letter)!.push(answerActor);
            engine.add(actor);
        } else {
            engine.add(answerActor);
        }
    }
    // --

    const gallowsBaseWidth = Math.round(context.screen.pixel.width * gallowsBaseWidthPercent);
    const gallowsDropX = Math.round(gallowsBaseWidth * gallowsHorizontalPercentOfBase);
    const gallowsHeight = Math.round(context.screen.pixel.height * gallowsHeightPercent);
    const gallowsOffsetX = Math.round(context.screen.pixel.width * gallowsOffsetXPercent);
    const gallowsOffsetY = Math.round(context.screen.pixel.height * gallowsOffsetYPercent);
    const gallowsDropXOffset = gallowsOffsetX + gallowsBaseWidth / 2 + gallowsDropX + 1;

    // --
    const showMessagePanel = (text: string) => {
        const message = xel.actors.fromText(context, text,
            {fgColor: 'negative'}, {});
        const stripe = new Actor({
            anchor: Vector.Zero,
            width: engine.drawWidth,
            height: message.height * 4,
            color: context.color.fg,
            pos: vec(0, engine.drawHeight - message.height * 4)
        });
        message.pos = vec(stripe.width / 2, stripe.height / 2);
        stripe.addChild(message);
        engine.add(stripe);
    };

    // --

    const hangman = new HangmanActor(context, xel.actorArgs.fromPixelBasedArgs(context, {
        anchor: Vector.Zero,
        x: gallowsDropXOffset - HangmanWidth / 2,
        y: gallowsOffsetY + Math.round(gallowsHeight * gallowsDropPercentOfHeight)
    }));
    engine.add(hangman);
    const addNextBodyPart = hangman.cycle();

    // --
    const usedLettersSet = new Set<string>();
    const chooseLetter = (letter: string) => {
        usedLettersSet.add(letter as string);
        const pSpots = letterToPlaceholderActors.get(letter as string);
        const aSpots = letterToAnswerActors.get(letter as string);
        if (pSpots && aSpots) {
            for (let spot of pSpots) {
                engine.remove(spot);
            }
            for (let spot of aSpots) {
                engine.add(spot);
            }
            letterToPlaceholderActors.delete(letter as string);
            letterToAnswerActors.delete(letter as string);
            if (letterToPlaceholderActors.size <= 0) {
                showMessagePanel('You win!');
                engine.emit('xelly:terminate', toTerminationResult(Array.from(usedLettersSet)));
            }
        } else {
            if (addNextBodyPart.next().value) {
                for (const [key, val] of letterToPlaceholderActors.entries()) {
                    for (let spot of val) {
                        engine.remove(spot);
                    }
                }
                for (const [key, val] of letterToAnswerActors.entries()) {
                    for (let spot of val) {
                        engine.add(spot);
                    }
                }
                showMessagePanel('You lose!');
                engine.emit('xelly:terminate', toTerminationResult(Array.from(usedLettersSet)));
            }
        }
    }
    letterPicker.on('picker:select', (letter: any) => {
        chooseLetter(letter as string);
    });
    engine.on('xelly:start', () => {
        if (userGameState) {
            for (const ch of userGameState.usedLetters) {
                chooseLetter(ch);
            }
            engine.emit('xelly:terminate'); // !!! terminate WITHOUT state !!!
        }
    });
};
