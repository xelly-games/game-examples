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
    EasingFunctions,
    Engine,
    Entity,
    Font,
    FontUnit,
    Graphic,
    Handler,
    ImageSource,
    Label,
    PostUpdateEvent,
    Sprite,
    SpriteSheet,
    vec,
    Vector
} from 'excalibur';
import cards from './cards-lg.png';
import golfBall from './golf.png';
import undoSvg from './undo.svg';

// --

const font12 = new Font({
    color: Color.White,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 12,
    bold: true
});

const font24 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 24
});

// --

const undoImageSource = new ImageSource(undoSvg);
const golfBallImageSource = new ImageSource(golfBall);

// --

export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const suits = ['Heart', 'Diamond', 'Club', 'Spade'] as const;

export type Rank = typeof ranks[number];
export type Suit = typeof suits[number];

export type Card = {
    suit: Suit,
    rank: Rank
};

export const isAdjacent = (card1: Card, card2: Card): boolean => {
    const idx1 = ranks.indexOf(card1.rank);
    const idx2 = ranks.indexOf(card2.rank);
    return Math.abs(idx1 - idx2) === 1;
};

// --

const cardsSpriteSheetImg = new ImageSource(cards);
const cardsSpriteSheetGridOptions = {
    image: cardsSpriteSheetImg,
    grid: {
        rows: 4,
        columns: 14,
        spriteWidth: 42,
        spriteHeight: 60
    },
    spacing: {
        originOffset: {x: 11, y: 2},
        margin: {x: 22, y: 4}
    }
};

const loadImgResources = () => {
    return Promise.all([cardsSpriteSheetImg.load(), undoImageSource.load(), golfBallImageSource.load()]);
}

const createSpriteSheet = () => { // ...after loading imagesource
    return SpriteSheet.fromImageSource(cardsSpriteSheetGridOptions);
};

// --

const cardToSpriteIndex = (card: Card): Vector => {
    const {rank, suit} = card;
    const rankIndex = ranks.indexOf(rank);
    const suitIndex = suits.indexOf(suit);
    return vec(rankIndex, suitIndex);
};

const getSpriteForCard = (sheet: SpriteSheet, card: Card)=> {
    const idx = cardToSpriteIndex(card);
    return sheet.getSprite(idx.x, idx.y);
};

const getSpriteForCardBacking = (sheet: SpriteSheet) => {
    return sheet.getSprite(13, 1);
};

// --

const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
const createDeck = () => {
    return suits.flatMap(suit => ranks.map(rank => ({
        suit,
        rank
    } as Card)));
};

// --

const defaultBoardMarginTop = 12;
const defaultCardXMargin = 8;
const stackedCardOffset = 25;

const deckMarginRight = 20;
const deckNextCardMarginLeftTop = 5;

// --

type BoardCardRef = {
    actor: Actor,
    card: Card,
    row: number,
    col: number
};

class Board extends Actor {

    _bounds: BoundingBox;
    refs: BoardCardRef[][] = Array.from({length: 7}, () => []);
    private readonly cardXMargin: number;

    constructor(config: ActorArgs, sheet: SpriteSheet, deck: Card[], cardXMargin: number = defaultCardXMargin) {
        super(config);
        this.cardXMargin = cardXMargin;
        const sampleCardSprite = getSpriteForCard(sheet, deck[0]);
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 5; row++) {
                const card = new Actor({
                    pos: this.determineCardPosForRowCol(sampleCardSprite, row, col),
                    anchor: Vector.Zero,
                    z: (row + 1) * 10
                });
                const index = col * 5 + row;
                const ref = { actor: card, card: deck[index], row, col };
                this.refs[col].push(ref);
                card.graphics.use(getSpriteForCard(sheet, deck[index]));
                const thisCol = col, thisRow = row;
                card.on('pointerdown', (e) => {
                    e.cancel();
                    if (this.refs[thisCol][thisRow] && this.refs[thisCol].length === thisRow + 1) {
                        this.emit('pick*', ref);
                    }
                });
                this.addChild(card);
            }
        }

        this._bounds = new BoundingBox({
            top: 0,
            left: 0,
            right: 7 * (this.cardXMargin + sampleCardSprite.width) - this.cardXMargin,
            bottom: 4 * stackedCardOffset + sampleCardSprite.height
        });
    }

    determineCardPosForRowCol(sampleCardSprite: Graphic, row: number, col: number) {
        return vec(col * (this.cardXMargin + sampleCardSprite.width), row * stackedCardOffset);
    }

    pop(ref: BoardCardRef) {
        const popped = this.refs[ref.col].pop();
        this.removeChild(popped!.actor);
        return popped!.actor; // expected to equal ref.actor
    }

    listFreeCards() {
        return this.refs
            .filter(col => col.length > 0)
            .map(col => col[col.length - 1])
            .map(ref => ref.card);
    }

    countRemainingCards() {
        return this.refs
            .flatMap(col => col)
            .length;
    }

    placePreviouslyPoppedCard(ref: BoardCardRef) {
        this.refs[ref.col].push(ref);
        ref.actor.pos = this.determineCardPosForRowCol(ref.actor.graphics.current!, ref.row, ref.col);
        // re-add previously-killed actor, which we'll expect still has it's
        // click handler, z-order, etc.
        this.addChild(ref.actor);
    }

}

// --

class Deck extends Actor {

    _bounds: BoundingBox;
    visibleCard: Actor;
    downCardBottom: Actor;
    downCardTop: Actor;
    downCardLabel?: Actor;

    constructor(config: ActorArgs, sheet: SpriteSheet, initialTopCardSprite: Sprite) {
        super(config);
        this.visibleCard = new Actor({
            pos: vec(deckNextCardMarginLeftTop + initialTopCardSprite.width + deckMarginRight,
                deckNextCardMarginLeftTop),
            anchor: Vector.Zero
        });
        this.visibleCard.graphics.use(initialTopCardSprite);
        this.addChild(this.visibleCard);

        const back = getSpriteForCardBacking(sheet);
        this.downCardBottom = new Actor({
            pos: vec(0, 0),
            anchor: Vector.Zero,
            z: 10
        });
        this.downCardBottom.graphics.use(back);
        this.addChild(this.downCardBottom);
        this.downCardBottom.on('pointerdown', (e) => {
            e.cancel();
            this.emit('deal*');
        });
        this.downCardTop = new Actor({
            pos: vec(deckNextCardMarginLeftTop, deckNextCardMarginLeftTop),
            anchor: Vector.Zero,
            z: 20
        });
        this.downCardTop.graphics.use(back);
        this.addChild(this.downCardTop);
        this.downCardTop.on('pointerdown', (e) => {
            e.cancel();
            this.emit('deal*');
        });

        this._bounds = new BoundingBox({
            top: 0,
            left: 0,
            right: deckNextCardMarginLeftTop + initialTopCardSprite.width + deckMarginRight + initialTopCardSprite.width,
            bottom: deckNextCardMarginLeftTop + initialTopCardSprite.height
        });
    }

    removeDownCardBottom() {
        // consider; animate
        this.removeChild(this.downCardBottom);
    }

    removeDownCardTop() {
        // consider; animate
        this.removeChild(this.downCardTop);
    }

    updateDownCardLabel(label: string) {
        if (this.downCardLabel) {
            this.downCardTop.removeChild(this.downCardLabel);
        }
        const measure = font12.measureText(label);
        this.downCardLabel = new Actor({
            anchor: Vector.Zero,
            pos: vec((this.downCardTop.graphics.current!.width - (measure.width + 6/*magic*/)) / 2,
                (this.downCardTop.graphics.current!.height - (measure.height + 4/*magic*/)) / 2),
            width: measure.width + 6/*magic*/,
            height: measure.height + 4/*magic*/,
            color: Color.Transparent, // Color.fromRGB(0, 0, 0, 0.1),
            z: 50
        });
        this.downCardLabel.addChild(new Label({
            anchor: Vector.Zero,
            pos: vec(3/*magic*/, 2/*magic*/),
            font: font12,
            text: label
        }));
        this.downCardTop.addChild(this.downCardLabel);
    }

    deal(nextVisibleCardSprite: Sprite, newDeckLength: number) {
        const nextCard = new Actor({
            pos: this.downCardTop.pos,
            anchor: Vector.Zero
        });
        this.updateDownCardLabel(`${newDeckLength}`);
        nextCard.graphics.use(nextVisibleCardSprite);
        this.addChild(nextCard);
        if (newDeckLength === 1) {
            this.removeDownCardBottom();
        }
        if (newDeckLength === 0) {
            this.removeDownCardTop();
        }
        return nextCard.actions.moveTo({
            pos: this.visibleCard.pos,
            duration: 75,
        }).toPromise().then(() => {
            this.visibleCard.graphics.use(nextCard.graphics.current!);
            this.removeChild(nextCard);
        });
    }

    undeal(backCardSprite: Sprite, nextVisibleCardSprite: Sprite, newDeckLength: number) {
        const backCard = new Actor({
            pos: this.visibleCard.pos,
            anchor: Vector.Zero
        });
        backCard.graphics.use(backCardSprite);
        this.addChild(backCard);
        this.visibleCard.graphics.use(nextVisibleCardSprite);
        return backCard.actions.moveTo({
            pos: this.downCardTop.pos,
            duration: 75
        }).toPromise().then(() => {
            this.removeChild(backCard);
            this.updateDownCardLabel(`${newDeckLength}`);
            if (newDeckLength > 1) {
                if (!this.children.includes(this.downCardBottom)) {
                    this.addChild(this.downCardBottom);
                }
            }
            if (newDeckLength > 0) {
                if (!this.children.includes(this.downCardTop)) {
                    this.addChild(this.downCardTop);
                }
            }
        });
    }

}

// --

const createUndoButton = () => {
    const undoButton = new Actor({
        anchor: Vector.Zero
    });
    undoButton.graphics.use(undoImageSource.toSprite());
    return undoButton;
};

// -- ending --

// type EndingRule = { min: number; msg: string };
//
// const EndingRules: EndingRule[] = [
//     { min: 35, msg: "Lol." },
//     { min: 25, msg: "Pretty gross." },
//     { min: 15, msg: "Embarrassing." },
//     { min: 10, msg: "Unlucky or unskilled?" },
//     { min: 8, msg: "Way below average" },
//     { min: 6, msg: "Below average." },
//     { min: 4, msg: "About par." },
//     { min: 2, msg: "Pretty good." },
//     { min: 0, msg: "Hole in one." },
// ];
//
// export function endingMessage(score: number): string {
//     return (EndingRules.find(r => score >= r.min) ?? EndingRules[EndingRules.length - 1]).msg;
// }

const createGameEndPane = (engine: Engine, message: string) => {
    const box = font24.measureText(message);
    const textMarginY = 10, bottomMarginY = 10;
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
        pos: vec(0, engine.drawHeight - box.height - textMarginY * 2 - bottomMarginY),
        width: engine.drawWidth,
        height: box.height + textMarginY * 2,
        color: Color.fromRGB(255, 255, 255, 0.9),
        z: 110
    });
    const label = new Label({
        text: message,
        color: Color.Black,
        font: font24,
        pos: vec((engine.drawWidth - box.width) / 2, textMarginY),
    });
    const golfSprite = golfBallImageSource.toSprite();
    const golfScale = (box.height + /*fudge*/textMarginY / 2) / golfSprite.height;
    golfSprite.scale = vec(golfScale, golfScale);
    const iconPosByText = vec(
        engine.drawWidth / 2 - box.width / 2 - golfSprite.width / 2,
        band.height / 2);
    const icon = new Actor({
        pos: vec(-golfSprite.width / 2, iconPosByText.y),
        z: 120,
        angularVelocity: 15
    });
    icon.graphics.use(golfSprite);
    icon.actions.moveTo({
        pos: iconPosByText,
        duration: 350
    }).toPromise().then(() => {
        const finalPosBall = vec(Math.max(golfSprite.width / 2 + /*magic*/5, iconPosByText.x - 100), iconPosByText.y);
        const ballDurationToStop = 750;
        // the "bump"
        label.actions.moveTo({
            pos: vec(label.pos.x + 50, label.pos.y),
            duration: 400,
            easing: EasingFunctions.EaseOutQuad
        }).toPromise().then(() => {
            label.actions.moveTo({
                pos: vec(finalPosBall.x + golfSprite.width / 2 + /*magic*/10, label.pos.y),
                duration: 650,
                easing: EasingFunctions.EaseOutQuad
            });
        });
        // ball rebound
        icon.angularVelocity = -10;
        const epoch = Date.now();
        const pu = (e: PostUpdateEvent<Entity<any>>) => {
            icon.angularVelocity *= (1 - Math.pow(Math.min(Date.now() - epoch, ballDurationToStop) / 1000, 5));
        };
        icon.on('postupdate', pu);
        return icon.actions.moveTo({
            pos: finalPosBall,
            duration: ballDurationToStop,
            easing: EasingFunctions.EaseOutQuad
        }).toPromise().then(() => {
            icon.angularVelocity = 0;
            icon.off('postupdate', pu);
        });
    });
    band.addChild(icon);
    band.addChild(label);
    glass.addChild(band);
    return glass;
};

// --

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.TurnBased
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const deck = shuffle(createDeck());
    let nextDeckCardIndex = 0;
    let currentVisibleCard: Card;

    type UndoItem = { pick: BoardCardRef } | { dealtIndex: number };

    const undoQueue: UndoItem[] = [];

    const visiblePile: Card[] = [];

    loadImgResources().then(() => {
        const sheet = createSpriteSheet();

        const templateSprite = getSpriteForCard(sheet, deck[0]);
        const cardXMargin = Math.max(1, Math.min(defaultCardXMargin,
            Math.floor((engine.drawWidth - 4/*i.e., minimal outer margin*/ - 7 * templateSprite.width) / 6)));

        const board = new Board({
            anchor: Vector.Zero
        }, sheet, deck, cardXMargin);
        board.pos.x = Math.floor((engine.drawWidth - board._bounds.width) / 2);
        board.pos.y = defaultBoardMarginTop;
        engine.add(board);

        nextDeckCardIndex += 7 * 5;
        currentVisibleCard = deck[nextDeckCardIndex];

        const initialTopCard = deck[nextDeckCardIndex++/*!!*/];
        visiblePile.push(initialTopCard);
        const deckActor = new Deck({
            anchor: Vector.Zero
        }, sheet, getSpriteForCard(sheet, initialTopCard));

        if (deckActor._bounds.height + board._bounds.height + defaultBoardMarginTop + 8/*fudge*/
            > engine.drawHeight) {
            // responsive move if height is too limited, and note we do this
            //   *before* we position the deck.
            board.pos.y = 2;
        }
        deckActor.pos.x = Math.floor((engine.drawWidth - deckActor._bounds.width) / 2);
        deckActor.pos.y = Math.ceil((engine.drawHeight - board.pos.y - board._bounds.height - deckActor._bounds.height) / 2 + board.pos.y + board._bounds.height);
        engine.add(deckActor);
        deckActor.updateDownCardLabel(`${deck.length - nextDeckCardIndex}`);

        // --
        const maybeCompleteGame = () => {
            if (deck.length - nextDeckCardIndex === 0 || board.countRemainingCards() === 0) {
                if (board.listFreeCards().every(card => !isAdjacent(card, currentVisibleCard))) {
                    setTimeout(() => {
                        const score = board.countRemainingCards();
                        const msg = `Score: ${score}${score === 0 ? '. You won!!!': ''}`;
                        engine.add(createGameEndPane(engine, msg));
                        engine.emit('xelly:terminate');
                    }, 50/*slight delay for effect*/);
                }
            }
        }

        // -- undo --
        const undoButton = createUndoButton();
        undoButton.pos = vec(
            engine.drawWidth - undoButton.graphics.current!.width - 10/*magic*/,
            engine.drawHeight - undoButton.graphics.current!.height - 10/*magic*/);
        undoButton.graphics.isVisible = false;
        engine.add(undoButton);
        const pushUndoItem = (item: UndoItem) => {
            undoQueue.push(item);
            undoButton.graphics.isVisible = true;
        }
        const popUndoItem = (): UndoItem | undefined => {
            const popped = undoQueue.pop();
            if (undoQueue.length === 0) {
                undoButton.graphics.isVisible = false;
            }
            return popped;
        };
        undoButton.on('pointerdown', (e) => {
            undoButton.actions.blink(75, 75, 2);
            const popped = popUndoItem();
            if (popped) {
                if ('pick' in popped) {
                    const {pick} = popped;
                    const boardPos =
                        board.determineCardPosForRowCol(pick.actor.graphics.current!, pick.row, pick.col);
                    const globalPos = boardPos.add(board.pos);
                    // restore picked actor and initially position over visibleCard...
                    pick.actor.pos = deckActor.visibleCard.pos.add(deckActor.pos);
                    engine.add(pick.actor);
                    // set actual visibleCard, which should render "under" restored to
                    //  the "under" card per visiblePile
                    deckActor.visibleCard.graphics.use(getSpriteForCard(sheet, visiblePile[visiblePile.length - 2]));
                    // animate...
                    pick.actor.actions.moveTo({
                        pos: globalPos,
                        duration: 126
                    }).toPromise().then(() => {
                        engine.remove(pick.actor);
                        board.placePreviouslyPoppedCard(pick);
                        visiblePile.pop();
                        currentVisibleCard = visiblePile[visiblePile.length - 1];
                    });
                } else {
                    nextDeckCardIndex = popped.dealtIndex; // should be same as nextDeckCardIndex--
                    deckActor.undeal(
                        getSpriteForCardBacking(sheet),
                        getSpriteForCard(sheet, visiblePile[visiblePile.length - 2]),
                        deck.length - nextDeckCardIndex).then(() => {
                        visiblePile.pop();
                        currentVisibleCard = visiblePile[visiblePile.length - 1];
                    });
                }
            }
        });

        board.on('pick*', ((pick: BoardCardRef) => {
            if (isAdjacent(pick.card, currentVisibleCard)) {
                const popped = board.pop(pick);
                popped.pos = popped.pos.add(board.pos);
                engine.add(popped);
                popped.actions.moveTo({
                    pos: deckActor.visibleCard.pos.add(deckActor.pos),
                    duration: 126,
                }).toPromise().then(() => {
                    // the visibleCard gets the picked card graphic in our swap-a-roo here...
                    deckActor.visibleCard.graphics.use(popped.graphics.current!);
                    visiblePile.push(pick.card);
                    currentVisibleCard = pick.card;
                    // it is GOOD that we kill the popped card, which has a click handler
                    //  on it...underneath it now is the visibleCard
                    popped.kill();
                    pushUndoItem({ pick });
                    maybeCompleteGame();
                });
            }
        }) as Handler<any>);

        deckActor.on('deal*', (() => {
            if (nextDeckCardIndex >= deck.length) {
                return;
            }
            const nextVisibleCard = deck[nextDeckCardIndex++/*!!*/];
            const nextCardSprite = getSpriteForCard(sheet, nextVisibleCard);
            const newDeckLength = deck.length - nextDeckCardIndex;
            deckActor.deal(nextCardSprite, newDeckLength).then(() => {
                visiblePile.push(nextVisibleCard);
                currentVisibleCard = nextVisibleCard;
                pushUndoItem({ dealtIndex: nextDeckCardIndex - 1 });
                maybeCompleteGame();
            });
        }))
    });
};
