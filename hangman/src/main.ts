import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Actor, Color, Engine, Line, vec, Vector} from 'excalibur';
import {Config} from './constants';
import {Gallows} from './gallows/Gallows';
//import {idioms} from './easy-idioms';
import {words} from './hard-words';
import {LetterPicker} from './LetterPicker';
import {Phrase} from './phrase/Phrase';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased,
    forkable: false
};

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
    const phraseStr = readPuzzlePhraseFromContextConfig(context)
        || words[Math.floor(Math.random() * words.length)].toUpperCase();
    const userGameState = readGameStateFromContextParameters(context);
    const suppressAnimations = userGameState !== undefined;

    // if phrase has spaces, then we are in hard mode -- i.e., we won't give
    //   user as many guesses as normal.
    const hardMode = phraseStr.includes(' ');

    // --

    const letterPickerMargin = vec(12, 10);
    const letterPicker
        = new LetterPicker(context.color.fg, engine.drawWidth - letterPickerMargin.x * 2);
    letterPicker.pos = vec(
        Math.floor((engine.drawWidth - letterPicker.totalWidth()) / 2),
        letterPickerMargin.y);
    engine.add(letterPicker);

    // --
    const gallowsMargin = vec(Config.GallowsLeftMargin, 25);
    const gallowsWidth = Math.floor(engine.drawWidth * 0.35);
    const gallowsHeight = engine.drawHeight
        - letterPicker.pos.y - letterPicker.totalHeightFirstTwoRows - gallowsMargin.y * 2;
    const gallows = new Gallows(context.color.fg, gallowsWidth, gallowsHeight, hardMode);
    gallows.pos = vec(gallowsMargin.x,
        letterPicker.pos.y + letterPicker.totalHeightFirstTwoRows + gallowsMargin.y);
    engine.add(gallows);

    // --
    const phrase = new Phrase(phraseStr, context.color.fg,
        engine.drawWidth - gallows.maxWidth
        - gallowsMargin.x * 2 - Config.PhraseMarginY * 2);
    phrase.pos = vec(
        Math.floor(gallows.pos.x + gallows.maxWidth + gallowsMargin.x),
        Math.floor(gallows.pos.y + gallowsHeight / 2 - phrase.totalHeight() / 2));
    engine.add(phrase);

    // --
    const showMessagePanel = (text: string) => {
        const graphic
            = xel.graphics.fromSpriteArray(xel.create.label(text),
            {color: Color.White});
        const panel = new Actor({
            anchor: Vector.Zero,
            width: engine.drawWidth,
            height: graphic.height * 4,
            color: context.color.fg,
            pos: vec(0, engine.drawHeight)
        });
        const message = new Actor({
            pos: vec(
                Math.round(panel.width / 2),
                Math.round(panel.height / 2))
        });
        message.graphics.use(graphic);
        panel.addChild(message);
        engine.add(panel);
        return panel.actions.moveTo({
            pos: vec(0, engine.drawHeight - graphic.height * 4),
            duration: 150
        }).toPromise();
    };

    // --

    const addNextBodyPart = gallows.hangman.cycle();

    // --
    phrase.on('phrase:complete', () => {
        showMessagePanel('You win!').then(() => {
            engine.emit('xelly:terminate',
                toTerminationResult(Array.from(usedLettersSet)));
        });
    });

    const usedLettersSet = new Set<string>();
    const chooseLetter = (letter: string) => {
        usedLettersSet.add(letter);
        if (!phrase.chooseLetter(letter)) {
            if (addNextBodyPart.next().value) { // true when no more guesses
                phrase.revealAllLetters();
                showMessagePanel('You lose!').then(() => {
                    engine.emit('xelly:terminate',
                        toTerminationResult(Array.from(usedLettersSet)));
                });
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
        } else {
            phrase.runInitialRevealPlaceholdersAnimation();
        }
    });
};
