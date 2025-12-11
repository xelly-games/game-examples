import {BoardConfig} from './board';
import {Move} from 'chess.js';
import {Actor, Color, Rectangle, vec, Vector} from 'excalibur';
import {getSpriteFromFenLetter, SpriteSheetInfo} from './sprites';

const margin = 5;

export const maybeCreatePromotionChooser = (ss: SpriteSheetInfo, boardConfig: BoardConfig, moves: Move[], sqColor: Color, bgColor: Color) => {
    const promotions = moves.filter(m => m.promotion);
    if (promotions.length === 0) {
        return undefined;
    }
    const panel = new Actor({
        anchor: Vector.Zero,
        // caller will read these dimensions from returned panel graphics to position it
        width: (boardConfig.squareDim + margin) * promotions.length + margin,
        height: boardConfig.squareDim + margin * 2,
        color: bgColor,
        z: 101, // !!
    });
    let offsetX = margin;
    promotions.reverse().forEach(m => {
        const rect = new Rectangle({
            width: boardConfig.squareDim,
            height: boardConfig.squareDim,
            color: sqColor
        });
        const rectActor = new Actor({
            anchor: Vector.Zero,
            pos: vec(offsetX, margin),
        });
        rectActor.graphics.use(rect);
        const promotionPieceLetter = m.promotion!;
        const fenLetter = (m.color === 'w' ? promotionPieceLetter.toUpperCase() : promotionPieceLetter);
        rectActor.on('pointerdown', () => {
            panel.emit('click*', {promotionPieceLetter});
        });
        panel.addChild(rectActor);
        const pieceTargetDim = boardConfig.squareDim - 8;
        const sprite = getSpriteFromFenLetter(ss, fenLetter, pieceTargetDim);
        const spriteActor = new Actor({
            anchor: Vector.Zero,
            pos: vec(Math.floor(boardConfig.squareDim / 2 - sprite.width / 2), Math.floor(boardConfig.squareDim / 2 - sprite.height / 2)),
            z: 102,
        });
        spriteActor.graphics.use(sprite);
        rectActor.addChild(spriteActor);
        offsetX += boardConfig.squareDim + margin;
    });
    return panel;
};
