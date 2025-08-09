import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    Actor,
    ActorArgs,
    BoundingBox,
    Color,
    Engine,
    Font,
    FontUnit,
    Graphic,
    Handler,
    ImageSource,
    Label,
    Rectangle,
    SpriteSheet,
    SpriteSheetGridOptions,
    vec,
    Vector
} from 'excalibur';
import {Card, ranks, suits} from './card-types';
//import cardsLg from './cards-lg.png';
import cardsMed from './cards-md.png';
import {endingMessage, pokerHandScores, vibe_getPokerHand} from './vibe_hands';

// ---

// const cardsSpriteSheet = new ImageSource(cardsLg);
// const cardsSpriteSheetGridOptions = {
//     image: cardsSpriteSheet,
//     grid: {
//         rows: 4,
//         columns: 14,
//         spriteWidth: 42,
//         spriteHeight: 60
//     },
//     spacing: {
//         originOffset: {x: 11, y: 2},
//         margin: {x: 22, y: 4}
//     }
// };
const cardsSpriteSheet = new ImageSource(cardsMed);
const cardsSpriteSheetGridOptions = {
    image: cardsSpriteSheet,
    grid: {
        rows: 10,
        columns: 15,
        spriteWidth: 20,
        spriteHeight: 29
    },
    spacing: {
        originOffset: {x: 6, y: 2},
        margin: {x: 12, y: 3}
    }
}

const loadSpriteSheet = () => {
    return cardsSpriteSheet.load();
}

const createSpriteSheet = () => { // ...after loading imagesource
    const sheet = SpriteSheet.fromImageSource(cardsSpriteSheetGridOptions);
    // NOTE: don't do this if using large cards
    sheet.sprites.forEach(s => {
        s.scale = vec(2, 2)
    });
    return sheet;
};

const getCardBack = (sheet: SpriteSheet) => {
    return sheet.getSprite(14, 1);
    // For large cards  : spriteSheet.getSprite(13, 1);
}

// ---

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
};

const cardMarginX = 5;
const cardMarginY = 5;
const layoutBottomMarginY = 5;
const layoutRightMarginY = 5;

const deckCardStackedOffset = 3;
const numDeckStackedCards = 4;
const numDeckFannedCards = 4;
const deckFaceUpCardMargin = 5;

const deckScoreSpaceBetween = 75;
const minDeckScoreMarginX = 5;
const maxDeckScoreMarginY = 25;

const font12 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 12
});

const font14 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 14
});

const font14_Gray = new Font({
    color: Color.Gray,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 14
});

const font18 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 18
});

const font24 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 24
});

const createLabel_xCentered = (text: string, font: Font, xCenter: number, yTop: number) => {
    return new Label({
        // note: Label always renderse anchor = Zero
        pos: vec(xCenter - font.measureText(text).width / 2, yTop),
        font,
        text
    });
};

const createLabel_yCentered = (text: string, font: Font, x: number, yCenter: number) => {
    return new Label({
        // note: Label always renderse anchor = Zero
        pos: vec(x, yCenter - font.measureText(text).height / 2),
        font,
        text
    });
};

const createOpenRect = (
    width: number, height?: number, color: Color = Color.DarkGray, lineWidth: number = 2, dashed: boolean = true) => {
    return new Rectangle({
        width: width,
        height: height || width,
        lineWidth: lineWidth,
        strokeColor: color,
        color: Color.Transparent,
        ...(dashed ? {lineDash: [2, 2]} : {})
    });
};

// --

const cardToSpriteIndex = (card: Card): Vector => {
    const {rank, suit} = card;
    const rankIndex = ranks.indexOf(rank);
    const suitIndex = suits.indexOf(suit);
    return vec(rankIndex, suitIndex);
};

function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getRow<T>(matrix: T[][], rowIndex: number): T[] {
    return [...matrix[rowIndex]];
}

function getColumn<T>(matrix: T[][], columnIndex: number): T[] {
    return matrix.map(row => row[columnIndex]);
}

// --

class Grid extends Actor {

    _bounds: BoundingBox;

    private places: Actor[][];
    private rowScores: Actor[];
    private colScores: Actor[];
    private readonly cardDim: Vector;
    private readonly margins: Vector;

    constructor(config: ActorArgs, sprite: Graphic, margins: Vector) {
        super(config);
        this.places = Array.from({length: 5}, () => Array(5).fill(undefined, 0, 5));
        this.rowScores = Array(5);
        this.colScores = Array(5);
        this.cardDim = vec(sprite.width, sprite.height);
        this.margins = margins;
        for (let row = 0; row < 5; ++row) {
            for (let col = 0; col < 5; ++col) {
                const place = new Actor({
                    anchor: Vector.Zero,
                    pos: vec(col * (sprite.width + margins.x), row * (sprite.height + margins.y))
                });
                place.graphics.add('outline*', sprite);
                place.graphics.use('outline*');
                place.on('pointerdown', () => {
                    this.emit('press*', vec(row, col));
                });
                this.addChild(place);
                this.places[row][col] = place;
            }
        }
        // CONSIDER: expand bounds to include score gutters?
        this._bounds = new BoundingBox({
            top: 0,
            left: 0,
            right: 5 * (sprite.width + margins.x) - margins.x,
            bottom: 5 * (sprite.height + margins.y) - margins.y
        });
    }

    layDownCard(sprite: Graphic, loc: Vector) {
        const slot = this.places[loc.x][loc.y];
        slot.graphics.use(sprite);
        // const actor = new Actor({
        //     anchor: Vector.Zero,
        //     pos: slot.pos,
        //     z: 10
        // });
        // actor.graphics.use(sprite);
        // this.addChild(actor);
    }

    unLayDownCard(loc: Vector) {
        const slot = this.places[loc.x][loc.y];
        slot.graphics.use('outline*');
    }

    removeRowScore(row: number) {
        if (this.rowScores[row]) {
            this.removeChild(this.rowScores[row]);
        }
    }

    removeColScore(col: number) {
        if (this.colScores[col]) {
            this.removeChild(this.colScores[col]);
        }
    }

    updateRowScore(row: number, score: number) {
        this.removeRowScore(row);
        const newRow = createLabel_yCentered(`${score}`, font14_Gray,
            5 * (this.cardDim.x + this.margins.x) - this.margins.x + layoutRightMarginY,
            row * (this.cardDim.y + this.margins.y) + this.cardDim.y / 2);
        this.rowScores[row] = newRow;
        this.addChild(newRow);
    }

    updateColScore(col: number, score: number) {
        this.removeColScore(col);
        const newCol = createLabel_xCentered(`${score}`, font14_Gray,
            col * (this.cardDim.x + this.margins.x) + this.cardDim.x / 2,
            5 * (this.cardDim.y + this.margins.y) - this.margins.y + layoutBottomMarginY);
        this.colScores[col] = newCol;
        this.addChild(newCol);
    }

}

// --

class Deck extends Actor {

    _bounds: BoundingBox;

    private readonly faceUpActor!: Actor;
    private readonly faceUpInnerActor!: Actor;
    private readonly topFannedCards!: Actor[];
    private _isFaceUpCardActive: boolean = false;

    constructor(config: ActorArgs, backSprite: Graphic, faceUpSprite: Graphic) {
        super(config);
        this.topFannedCards = Array.from({length: numDeckFannedCards});
        let localDeckXOffset = 0, localDeckYOffset = deckFaceUpCardMargin;
        for (let i = 0; i < numDeckStackedCards + numDeckFannedCards; ++i) {
            const card = new Actor({
                anchor: Vector.Zero,
                pos: vec(localDeckXOffset, localDeckYOffset)
            });
            card.graphics.use(backSprite);
            this.addChild(card);
            if (i >= numDeckStackedCards) {
                card.z = i - numDeckStackedCards;
                this.topFannedCards[i - numDeckStackedCards] = card;
            }
            localDeckXOffset += i < numDeckStackedCards ? deckCardStackedOffset : Math.round(faceUpSprite.width * 0.25);
        }
        localDeckXOffset = localDeckXOffset + backSprite.width + 5;
        this.faceUpActor = new Actor({
            anchor: Vector.Zero,
            pos: vec(localDeckXOffset, localDeckYOffset - deckFaceUpCardMargin/*!*/),
            width: faceUpSprite.width + deckFaceUpCardMargin * 2,
            height: faceUpSprite.height + deckFaceUpCardMargin * 2,
            color: Color.fromRGB(0, 255, 0, 0.75)
        });
        this.faceUpActor.graphics.use('no-graphic', undefined);
        this.faceUpInnerActor = new Actor({
            anchor: Vector.Zero,
            pos: vec(deckFaceUpCardMargin, deckFaceUpCardMargin)
        });
        this.faceUpInnerActor.graphics.add('outline',
            createOpenRect(faceUpSprite.width, faceUpSprite.height));
        this.faceUpInnerActor.graphics.use(faceUpSprite);
        this.faceUpInnerActor.on('pointerdown', () => {
            if (this.isFaceUpCardActive) {
                this.deactivateFaceUpCard();
            } else {
                this.activateFaceUpCard();
            }
        });
        this.faceUpActor.addChild(this.faceUpInnerActor);
        this.addChild(this.faceUpActor);
        localDeckXOffset += faceUpSprite.width + deckFaceUpCardMargin * 2;
        this._bounds = new BoundingBox({
            top: 0,
            left: 0,
            right: localDeckXOffset,
            bottom: backSprite.height + deckFaceUpCardMargin * 2
        });
    }

    get isFaceUpCardActive(): boolean {
        return this._isFaceUpCardActive;
    }

    activateFaceUpCard() {
        if (!this._isFaceUpCardActive) {
            this.faceUpActor.graphics.use('default');
            this._isFaceUpCardActive = true;
        }
    }

    deactivateFaceUpCard() {
        if (this._isFaceUpCardActive) {
            this.faceUpActor.graphics.use('no-graphic');
            this._isFaceUpCardActive = false;
        }
    }

    hardReplaceFaceUpCard(newFaceUpSprite: Graphic) {
        this.deactivateFaceUpCard();
        this.faceUpInnerActor.graphics.use(newFaceUpSprite);
    }

    animateReplaceFaceUpCard(newFaceUpSprite: Graphic) {
        this.deactivateFaceUpCard();
        this.faceUpInnerActor.graphics.use('outline');
        const top = this.topFannedCards[this.topFannedCards.length - 1];
        top.actions.moveTo({
            pos: vec(this.faceUpActor.pos.x + deckFaceUpCardMargin,
                this.faceUpActor.pos.y + deckFaceUpCardMargin),
            duration: 150
        }).toPromise().then(() => {
            this.topFannedCards.unshift(this.topFannedCards.pop()!);
            const localStackedStartOffsetX = numDeckStackedCards * deckCardStackedOffset;
            top.pos = vec(localStackedStartOffsetX, deckFaceUpCardMargin/*!*/);
            for (let i = 0; i < this.topFannedCards.length; ++i) {
                this.topFannedCards[i].z = i;
                this.topFannedCards[i].actions.moveTo({
                    pos: vec(localStackedStartOffsetX + i * Math.round(newFaceUpSprite.width * 0.25), deckFaceUpCardMargin/*!*/),
                    duration: 150
                });
            }
            this.faceUpInnerActor.graphics.use(newFaceUpSprite);
        });
    }

}

// --

const scoreTitleText = 'Score';
const scoreTitleFont = font18;
const scoreTitleTextBounds = scoreTitleFont.measureText(scoreTitleText);
const scoreTitleTextTopMargin = 5;

class Score extends Actor {

    private scoreValue!: Label;
    private scoreTitle!: Label;

    _bounds!: BoundingBox;

    constructor(config: ActorArgs) {
        super(config);
        this.updateScoreValue(0);
    }

    updateScoreValue(val: number) {
        const scoreValueTextBounds = font24.measureText(`${val}`);
        if (this.scoreValue) {
            this.removeChild(this.scoreValue);
        }
        this.scoreValue = new Label({
            anchor: Vector.Zero,
            pos: vec(scoreValueTextBounds.width <= scoreTitleTextBounds.width ? (scoreTitleTextBounds.width - scoreValueTextBounds.width) / 2 : 0, 0),
            text: `${val}`,
            font: font24
        });
        this.addChild(this.scoreValue);
        const scoreTitlePos = vec(scoreTitleTextBounds.width <= scoreValueTextBounds.width ? (scoreValueTextBounds.width - scoreTitleTextBounds.width) / 2 : 0,
            scoreValueTextBounds.height + scoreTitleTextTopMargin);
        if (this.scoreTitle) {
            this.scoreTitle.pos = scoreTitlePos;
        } else {
            this.scoreTitle = new Label({
                anchor: Vector.Zero,
                text: scoreTitleText,
                pos: scoreTitlePos,
                font: font18
            });
            this.addChild(this.scoreTitle);
        }
        this._bounds = new BoundingBox({
            top: 0,
            left: 0,
            right: Math.max(scoreTitleTextBounds.width, scoreValueTextBounds.width),
            bottom: scoreTitlePos.y + scoreTitleTextBounds.bottom
        });
    }

}

// --

class DeckAndScore extends Actor {
    readonly deck: Deck;
    readonly score: Score;

    constructor(config: ActorArgs, backSprite: Graphic, initialFaceUpSprite: Graphic) {
        super(config);
        this.deck = new Deck({anchor: Vector.Zero}, backSprite, initialFaceUpSprite);
        this.score = new Score({anchor: Vector.Zero});
        const deckOffsetX = 0;
        const deckOffsetY = (this.deck._bounds.height > this.score._bounds.height ? 0 : (this.score._bounds.height - this.deck._bounds.height) / 2);
        const scoreOffsetX = deckOffsetX + this.deck._bounds.width + deckScoreSpaceBetween;
        const scoreOffsetY = (this.score._bounds.height > this.deck._bounds.height ? 0 : (this.deck._bounds.height - this.score._bounds.height) / 2);
        this.deck.pos = vec(deckOffsetX, deckOffsetY);
        this.score.pos = vec(scoreOffsetX, scoreOffsetY);
        /*this.addChild(new Actor({
            anchor: Vector.Zero,
            pos: vec(0, 0),
            width: this._bounds.width,
            height: this._bounds.height,
            color: Color.fromRGB(255, 0, 0, 0.1)
        }));*/
        this.addChild(new Actor({
            anchor: Vector.Zero,
            pos: vec(0, 0),
        }))
        this.addChild(this.deck);
        this.addChild(this.score);
    }

    get _bounds(): BoundingBox {
        return new BoundingBox({
            top: 0,
            left: 0,
            right: this.deck._bounds.width + deckScoreSpaceBetween + this.score._bounds.width,
            bottom: Math.max(this.deck._bounds.bottom, this.score._bounds.bottom)
        });
    }

}

// --

const createGameEndPane = (engine: Engine, message: string) => {
    //
    const box = font24.measureText(message);
    const textMarginY = 10;
    const glass = new Actor({
        anchor: Vector.Zero,
        pos: vec(0, 0),
        width: engine.drawWidth,
        height: engine.drawHeight,
        color: Color.fromRGB(0, 0, 0, 0.3),
        z: 100
    });
    const band = new Actor({
        anchor: Vector.Zero,
        pos: vec(0, (engine.drawHeight - box.height - textMarginY * 2) / 2),
        width: engine.drawWidth,
        height: box.height + textMarginY * 2,
        color: Color.fromRGB(255, 255, 255, 0.9),
        z: 110
    });
    band.addChild(new Label({
        text: message,
        color: Color.Black,
        font: font24,
        pos: vec((engine.drawWidth - box.width) / 2, textMarginY),
    }))
    glass.addChild(band);
    return glass;
};

// --

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    console.log('install...'); // todo
    const deck: Card[] = suits.flatMap(suit => ranks.map(rank => ({
        suit,
        rank
    } as Card)));

    const shuffled = shuffle(deck);
    let topCardIndex = 0;

    let scoreNumber = 0;
    const state: (Card | undefined)[][] = Array.from({length: 5}, () => Array(5).fill(undefined, 0, 5));

    const imgSourceLoadProm = loadSpriteSheet();
    imgSourceLoadProm.then(() => {
        const spriteSheet = createSpriteSheet();

        const useCardMarginX = cardMarginX;
        const useCardMarginY = cardMarginY;

        // deck and score
        const topCardSpriteIndex = cardToSpriteIndex(shuffled[topCardIndex]);
        const currTopCardSprite = spriteSheet.getSprite(topCardSpriteIndex.x, topCardSpriteIndex.y);
        const cardBackSprite = getCardBack(spriteSheet);
        const deckAndScore =
            new DeckAndScore({anchor: Vector.Zero},
                cardBackSprite, currTopCardSprite);
        deckAndScore.score.updateScoreValue(scoreNumber);

        // separator / hr
        const separator = new Actor({
            anchor: Vector.Zero,
            width: engine.drawWidth/*grid._bounds.width + 38/!*magic*!/!*2*/,
            height: 1,
            color: Color.Transparent // Color.LightGray
        });

        // grid
        const grid = new Grid({anchor: Vector.Zero},
            createOpenRect(spriteSheet.getSprite(0, 0).width, spriteSheet.getSprite(0, 0).height),
            vec(useCardMarginX, useCardMarginY));
        engine.add(grid);

        let useDeckScoreMargin;
        if (grid._bounds.height + deckAndScore._bounds.height + maxDeckScoreMarginY * 2 >= engine.drawHeight - 10/*magic*/) {
            useDeckScoreMargin = minDeckScoreMarginX;
        } else {
            useDeckScoreMargin = maxDeckScoreMarginY;
        }

        deckAndScore.pos = vec(
            (engine.drawWidth - deckAndScore._bounds.width) / 2,
            engine.drawHeight - deckAndScore._bounds.height - useDeckScoreMargin);
        separator.pos = vec(0/*layoutOffsetX - 38/!*magic*!/*/,
            engine.drawHeight - deckAndScore._bounds.height - useDeckScoreMargin * 2);
        const gridX = Math.floor((engine.drawWidth - grid._bounds.width) / 2);
        const gridY = Math.floor((separator.pos.y - grid._bounds.height) / 2);
        grid.pos = vec(gridX, gridY);

        engine.add(deckAndScore);
        engine.add(separator);
        engine.add(grid);

        type MoveState = {
            loc: Vector,
            scoreIncrease: number,
            completedRow?: number
            completedCol?: number
        };

        const moveStates: MoveState[] = [];

        const undo = new Label({
            pos: vec(engine.drawWidth - font14.measureText('undo').width - 10, 10),
            text: 'undo',
            font: font14,
            color: Color.Gray,
            z: 100,
            visible: false /*initially*/
        });

        grid.on('press*', ((loc: Vector) => {
            if (state[loc.x/*row*/][loc.y/*col*/] === undefined && deckAndScore.deck.isFaceUpCardActive) {
                const prevScore = scoreNumber;
                let completedRow, completedCol;
                state[loc.x][loc.y] = shuffled[topCardIndex];
                const currIndex = cardToSpriteIndex(shuffled[topCardIndex]);
                const currSprite = spriteSheet.getSprite(currIndex.x, currIndex.y);
                grid.layDownCard(currSprite, loc);
                ++topCardIndex;
                const topCardSpriteIndex = cardToSpriteIndex(shuffled[topCardIndex]);
                const sprite = spriteSheet.getSprite(topCardSpriteIndex.x, topCardSpriteIndex.y);
                deckAndScore.deck.animateReplaceFaceUpCard(sprite);
                const row = getRow(state, loc.x);
                const col = getColumn(state, loc.y);
                if (row.every(c => c !== undefined)) {
                    const rowHand = vibe_getPokerHand(row);
                    const rowScore = pokerHandScores.get(rowHand) || 0;
                    scoreNumber += rowScore;
                    grid.updateRowScore(loc.x, rowScore);
                    completedRow = loc.x; // !!
                }
                if (col.every(c => c !== undefined)) {
                    const colHand = vibe_getPokerHand(col);
                    const colScore = pokerHandScores.get(colHand) || 0;
                    scoreNumber += colScore;
                    grid.updateColScore(loc.y, colScore);
                    completedCol = loc.y; // !!
                }
                deckAndScore.score.updateScoreValue(scoreNumber);
                if (state.every(x => x.every(c => c !== undefined))) {
                    const msg = `Score: ${scoreNumber}. ${endingMessage(scoreNumber)}`;
                    engine.add(createGameEndPane(engine, msg));
                    engine.emit('xelly:terminate');
                }
                moveStates.push({
                    loc,
                    scoreIncrease: scoreNumber - prevScore,
                    completedRow,
                    completedCol
                });
                undo.graphics.isVisible = true;
            }
        }) as Handler<unknown>);

        undo.on('pointerdown', () => {
            if (topCardIndex > 0 && /*expected:*/moveStates.length > 0) {
                --topCardIndex;
                const topCardSpriteIndex = cardToSpriteIndex(shuffled[topCardIndex]);
                const sprite = spriteSheet.getSprite(topCardSpriteIndex.x, topCardSpriteIndex.y);
                deckAndScore.deck.hardReplaceFaceUpCard(sprite);
                const lastMoveState = moveStates.pop()!;
                state[lastMoveState.loc.x][lastMoveState.loc.y] = undefined;
                grid.unLayDownCard(lastMoveState.loc);
                scoreNumber -= lastMoveState.scoreIncrease;
                deckAndScore.score.updateScoreValue(scoreNumber);
                if (lastMoveState.completedRow !== undefined) {
                    grid.removeRowScore(lastMoveState.completedRow);
                }
                if (lastMoveState.completedCol !== undefined) {
                    grid.removeColScore(lastMoveState.completedCol);
                }
                undo.graphics.isVisible = topCardIndex > 0;
            }
        });
        engine.add(undo);
    });
};
