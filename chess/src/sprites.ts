import {SpriteSheet, vec} from 'excalibur';
import piecesSvg from './pieces-svg';
import {GetSpriteOptions} from 'excalibur/build/dist/Graphics/SpriteSheet';

const optsBlack = {
    image: piecesSvg,
    grid: {
        rows: 2,
        columns: 8,
        spriteWidth: 95,
        spriteHeight: 99 /*96*/
    },
    spacing: {
        originOffset: {x: 168, y: 83 /*85*/},
        margin: {x: 0, y: 0}
    }
};

const optsWhite = {
    image: piecesSvg,
    grid: {
        rows: 2,
        columns: 8,
        spriteWidth: 95,
        spriteHeight: 96 /*96*/
    },
    spacing: {
        originOffset: {x: 168, y: 83 + 96 * 6 /*85*/},
        margin: {x: 0, y: 0}
    }
};

export type SpriteSheetInfo = {
    white: SpriteSheet,
    black: SpriteSheet
};

export const load = async (): Promise<SpriteSheetInfo> => {
    await piecesSvg.load();
    return {
        white: SpriteSheet.fromImageSource(optsWhite),
        black: SpriteSheet.fromImageSource(optsBlack)
    };
};

export const getSpriteFromFenLetter = (sheet: SpriteSheetInfo, pieceLetter: string, targetDim: number) => {
    const getOpts: GetSpriteOptions
        = { scale: vec(targetDim / optsBlack.grid.spriteWidth, targetDim / optsBlack.grid.spriteHeight) };
    switch (pieceLetter) {
        case 'K':
            return sheet.white.getSprite(4, 1, getOpts);
        case 'Q':
            return sheet.white.getSprite(3, 1, getOpts);
        case 'R':
            return sheet.white.getSprite(0, 1, getOpts);
        case 'B':
            return sheet.white.getSprite(2, 1, getOpts);
        case 'N':
            return sheet.white.getSprite(1, 1, getOpts);
        case 'P':
            return sheet.white.getSprite(0, 0, getOpts);
        case 'k':
            return sheet.black.getSprite(4, 0, getOpts);
        case 'q':
            return sheet.black.getSprite(3, 0, getOpts);
        case 'r':
            return sheet.black.getSprite(0, 0, getOpts);
        case 'b':
            return sheet.black.getSprite(2, 0, getOpts);
        case 'n':
            return sheet.black.getSprite(1, 0, getOpts);
        case 'p':
            return sheet.black.getSprite(0, 1, getOpts);
        default:
            throw new Error('bad arg');
    }
};
