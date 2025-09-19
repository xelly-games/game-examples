import * as xel from '@xelly/xelly.js';
import {Color, Graphic} from 'excalibur';
import {Config} from '../constants';

export type Placement = {
    x: number,
    y: number,
    graphic: Graphic,
    letter: string,
    show: boolean
};

type PhraseLine = {
    wordLetters: string[][],
    wordGraphics: Graphic[][],
    hypenate: boolean
};

export const determineMaxLetterWidth = () => {
    const letterWGraphic = xel.graphics.fromSpriteArray(xel.create.label('W'));
    return letterWGraphic.width;
}

export const layoutPhrase = (phrase: string, themeColor: Color, maxWidth: number): Placement[] => {
    const vspacing = Config.PhraseLineSpacingY;
    const letterSpacing = 3;

    const hyphenGraphic = xel.graphics.fromSpriteArray(xel.create.label('-'),
        {color: themeColor});
    const useSpaceWidth = Math.ceil(hyphenGraphic.width * 1.5);

    const MaxLetterWidth = determineMaxLetterWidth();

    const words = phrase.trim().split(/\s+/);
    const lines: PhraseLine[] = [];
    let currentLine: PhraseLine = {
        wordLetters: [[]],
        wordGraphics: [[]],
        hypenate: false
    };
    let currentLineWidth = 0;
    let currentTotalHeight = 0;
    let currentLineHeight = 0;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (const letter of word) {
            const letterGraphic = xel.graphics.fromSpriteArray(xel.create.label(letter),
                {color: themeColor});
            currentLineHeight = letterGraphic.height; // assume all letters same height
            if (currentLineWidth + /*letterSpriteWidth*/MaxLetterWidth + letterSpacing > maxWidth) {
                if (currentLine.wordLetters.length === 1) {
                    // line only has one word but that word can't fit so we'll have
                    // to hyphenate it
                    currentLine.hypenate = true;
                    lines.push(currentLine);
                    currentTotalHeight += currentLineHeight + vspacing;
                    currentLine = {
                        wordLetters: [[letter]],
                        wordGraphics: [[letterGraphic]],
                        hypenate: false
                    };
                    currentLineWidth = /*letterSpriteWidth*/MaxLetterWidth;
                } else {
                    const nextWordLetters = [[...currentLine.wordLetters.pop() as string[], letter]];
                    const nextWordGraphics = [[...currentLine.wordGraphics.pop() as Graphic[], letterGraphic]];
                    lines.push(currentLine); // after ^mutations
                    currentTotalHeight += currentLineHeight + vspacing;
                    currentLine = {
                        wordLetters: nextWordLetters,
                        wordGraphics: nextWordGraphics,
                        hypenate: false
                    };
                    currentLineWidth = 0;
                    for (let wordGraphic of nextWordGraphics) {
                        for (let wordLetterGraphic of wordGraphic) {
                            currentLineWidth += /*xel.measure.width(wordSpriteLetter)*/MaxLetterWidth + letterSpacing;
                        }
                    }
                }
            } else {
                currentLine.wordLetters[currentLine.wordLetters.length - 1].push(letter);
                currentLine.wordGraphics[currentLine.wordLetters.length - 1].push(letterGraphic);
                currentLineWidth += /*xel.measure.width(letterSprite)*/MaxLetterWidth + letterSpacing;
            }
        }
        if (i < words.length - 1) { // more words are coming
            currentLineWidth += useSpaceWidth;
            currentLine.wordLetters.push([]);
            currentLine.wordGraphics.push([]);
        } else { // no more words
            if (currentLine.wordLetters.length > 0) {
                lines.push(currentLine);
                currentTotalHeight += currentLineHeight + vspacing;
                currentLine = {
                    wordLetters: [[]],
                    wordGraphics: [[]],
                    hypenate: false
                };
            }
        }
    }

    const layout: Placement[] = [];
    let totalHeight = 0;
    for (let line of lines) {
        totalHeight += line.wordGraphics[0][0].height + vspacing;
    }
    let currentOffsetY = 0;
    for (let line of lines) {
        let lineWidth = 0;
        for (let i = 0; i < line.wordLetters.length; i++) {
            const oneWordGraphics = line.wordGraphics[i];
            for (let oneWordLetterSprite of oneWordGraphics) {
                lineWidth += MaxLetterWidth + letterSpacing;
            }
            if (i < line.wordLetters.length - 1) {
                lineWidth += useSpaceWidth;
            }
        }
        if (line.hypenate) {
            lineWidth += hyphenGraphic.width;
        }
        const lineOffsetX = Math.floor((maxWidth - lineWidth) / 2);
        let currentOffsetX = lineOffsetX;
        for (let i = 0; i < line.wordLetters.length; i++) {
            const oneWordGraphics = line.wordGraphics[i];
            for (let j = 0; j < oneWordGraphics.length; j++) {
                const oneWordLetterGraphic = oneWordGraphics[j];
                //     x: number, y: number, sprite: number[][], letter: string, show: boolean
                layout.push({
                    x: currentOffsetX,
                    y: currentOffsetY,
                    graphic: oneWordLetterGraphic,
                    letter: line.wordLetters[i][j],
                    show: !(/^[A-Z]$/.test(line.wordLetters[i][j]))
                });
                currentOffsetX += MaxLetterWidth + letterSpacing;
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
                graphic: hyphenGraphic,
                letter: '-',
                show: true
            });
        }
        currentOffsetY += line.wordGraphics[0][0].height + vspacing;
    }
    return layout;
};
