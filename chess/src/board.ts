import {
    Actor,
    Circle,
    Color,
    EasingFunctions,
    Handler,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import {getSpriteFromFenLetter, SpriteSheetInfo} from './sprites';

const LightGray = Color.fromRGB(171, 171, 171);
const DarkGray = Color.fromRGB(113, 113, 113);

const Beige = Color.fromRGB(231, 229, 203);
const Green = Color.fromRGB(105, 138, 71);

const LightSquareColor = Beige;
export const DarkSquareColor = Green;

const SaddleBrown = Color.fromRGB(139, 69, 19);
const PeruBrown = Color.fromRGB(205, 133, 63);
const BurlyWoodBrown = Color.fromRGB(222, 184, 135);
const BorderColor = Green;

export type BoardConfig = {
    border: number,
    halfBorder: number,
    dim: number,
    interiorDim: number,
    squareDim: number
};

export type RowCol = {
    row: number;
    col: number;
};

export type MoveSpec = {
    from: RowCol;
    to: RowCol;
    promotion?: string,
    kill?: RowCol;
    from2?: RowCol;
    to2?: RowCol;
};

export const createBoardConfig = (halfBorder: number, idealExteriorDim: number): BoardConfig => {
    const idealInteriorDim = idealExteriorDim - halfBorder * 2 * 2;
    const interiorDim = idealInteriorDim - idealInteriorDim % 8;
    return {
        border: halfBorder * 2,
        halfBorder,
        dim: interiorDim + halfBorder * 2,
        // note: we expect border to be even, interiorDim to be multiple of 8
        interiorDim,
        squareDim: interiorDim / 8
    };
};

export class Board extends Actor {

    private mask: Actor;
    private dimmer: Actor;
    private readonly halos: Actor[];
    private numHalosShowing: number = 0;
    private readonly dots: Actor[];
    private numDotsShowing: number = 0;
    private readonly pieces: (Actor | undefined)[][] // [row][col]
        = Array(8).fill(undefined).map(() => Array(8).fill(undefined));

    constructor(public readonly config: BoardConfig) {
        super();
        const board = new Actor({
            anchor: Vector.Zero
        });
        board.graphics.use(new Rectangle({
            width: this.config.dim,
            height: this.config.dim,
            lineWidth: this.config.border,
            strokeColor: BorderColor,
            color: Color.Transparent
        }));
        this.addChild(board);

        this.dimmer = new Actor({
            anchor: Vector.Zero,
            z: 55
        });
        this.dimmer.graphics.use(new Rectangle({
            width: this.config.dim,
            height: this.config.dim,
            lineWidth: this.config.border,
            color: Color.fromRGB(255, 255, 255, 0.80)
        }));

        let currSqColor = LightSquareColor;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const rect = new Rectangle({
                    width: this.config.squareDim,
                    height: this.config.squareDim,
                    color: currSqColor
                });
                const sq = new Actor({
                    anchor: Vector.Zero
                });
                sq.graphics.use(rect);
                sq.pos = vec(
                    this.config.halfBorder + col * this.config.squareDim,
                    this.config.halfBorder + row * this.config.squareDim);
                sq.on('pointerdown',
                    ((evt: PointerEvent) => this.emit('click*', {evt, row, col, sqColor: currSqColor})) as Handler<any>);
                board.addChild(sq);
                currSqColor =
                    currSqColor === LightSquareColor ? DarkSquareColor : LightSquareColor;
            }
            currSqColor =
                currSqColor === LightSquareColor ? DarkSquareColor : LightSquareColor;
        }
        // mask
        this.mask = new Actor({
            anchor: Vector.Zero,
            z: 10
        });
        this.mask.graphics.use(new Rectangle({
            width: this.config.squareDim,
            height: this.config.squareDim,
            strokeColor: Color.fromRGB(0, 0, 0),
            lineWidth: 8,
            color: Color.Transparent
        }));
        // this.mask.actions.repeatForever(ctx => {
        //     ctx.fade(0, 750).fade(1, 250); // ms
        // });
        // dots
        const dotGraphic = new Circle({
            radius: 6,
            color: Color.fromRGB(0, 0, 0, 0.6)
        });
        this.dots = Array(30).fill(undefined).map(() => {
            const a = new Actor({
                anchor: Vector.Zero,
                z: 10
            });
            a.graphics.use(dotGraphic);
            return a;
        });
        // halo
        const haloGraphic = new Circle({
            radius: Math.floor(this.config.squareDim / 2),
            color: Color.fromRGB(0, 0, 0, 0.3)
        });
        this.halos = Array(20).fill(undefined).map(() => {
            const a = new Actor({
                anchor: Vector.Zero,
                z: 49
            });
            a.graphics.use(haloGraphic);
            return a;
        });
    }

    dim() {
        if (!this.dimmer.parent) {
            this.addChild(this.dimmer);
        }
    }

    undim() {
        if (this.dimmer.parent) {
            this.removeChild(this.dimmer);
        }
    }

    place(piece: Actor, row: number, col: number) {
        piece.z = 50;
        this.addChild(piece);
        piece.pos = vec(
            this.config.halfBorder + col * this.config.squareDim + Math.floor(this.config.squareDim / 2),
            this.config.halfBorder + row * this.config.squareDim + Math.floor(this.config.squareDim / 2));
        this.pieces[row][col] = piece;
    }

    highlight(row: number, col: number) {
        this.mask.pos = vec(
            this.config.halfBorder + col * this.config.squareDim,
            this.config.halfBorder + row * this.config.squareDim);
        if (!this.mask.parent) {
            this.addChild(this.mask);
        }
    }

    clearHighlightAndDotsAndHalos() {
        for (let i = 0; i < this.numHalosShowing; i++) {
            this.removeChild(this.halos[i]);
        }
        this.numHalosShowing = 0;
        if (this.mask.parent) {
            this.removeChild(this.mask);
        }
        for (let i = 0; i < this.numDotsShowing; i++) {
            this.removeChild(this.dots[i]);
        }
        this.numDotsShowing = 0;
    }

    dotOrHalo(row: number, col: number) {
        const piece = this.pieces[row][col];
        if (piece) { // halo
            const use = this.halos[this.numHalosShowing++];
            use.pos = vec(
                this.config.halfBorder + col * this.config.squareDim
                + Math.floor((this.config.squareDim - use.graphics.current!.width) / 2),
                this.config.halfBorder + row * this.config.squareDim
                + Math.floor((this.config.squareDim - use.graphics.current!.height) / 2));
            this.addChild(use);
            return use;
        } else { // dot
            const use = this.dots[this.numDotsShowing++];
            use.pos = vec(
                this.config.halfBorder + col * this.config.squareDim
                + Math.floor((this.config.squareDim - use.graphics.current!.width) / 2),
                this.config.halfBorder + row * this.config.squareDim
                + Math.floor((this.config.squareDim - use.graphics.current!.height) / 2));
            this.addChild(use);
            return use;
        }
    }

    async move(ss: SpriteSheetInfo, move: MoveSpec, who: 'system' | 'human') {
        const fromPiece = this.pieces[move.from.row][move.from.col];
        if (!fromPiece) {
            return Promise.resolve(); // unexpected; caller should only call move for known pieces
        }
        const from2Piece = move.from2
            ? this.pieces[move.from2.row][move.from2.col]
            : undefined;
        const toPiece = this.pieces[move.to.row][move.to.col];
        // assume that there's no to2Piece
        const killPiece =
            move.kill ? this.pieces[move.kill.row][move.kill.col] : undefined;
        const targetPos = vec(
            this.config.halfBorder + move.to.col * this.config.squareDim + Math.floor(this.config.squareDim / 2),
            this.config.halfBorder + move.to.row * this.config.squareDim + Math.floor(this.config.squareDim / 2));
        const target2Pos = move.to2 ? vec(
                this.config.halfBorder + move.to2.col * this.config.squareDim + Math.floor(this.config.squareDim / 2),
                this.config.halfBorder + move.to2.row * this.config.squareDim + Math.floor(this.config.squareDim / 2))
            : undefined;
        fromPiece.z = 51;
        const blinkPeriod = 150;
        const numBlinks = 2;
        const overallDuration = Math.max(250, blinkPeriod * 2 * numBlinks - blinkPeriod);
        const doTilt_ = () =>
            who === 'system'
                ? fromPiece.actions.rotateTo({
                    angle: 0.1,
                    duration: 125
                }).toPromise()
                : Promise.resolve();
        const doTiltBack_ = () =>
            who === 'system'
                ? fromPiece.actions.rotateTo({
                    angle: 0,
                    duration: 100
                }).toPromise()
                : Promise.resolve();
        const doMove_ = () => {
            return fromPiece.actions.moveTo({
                pos: targetPos,
                duration: overallDuration,
                easing: EasingFunctions.EaseOutQuad
            }).toPromise();
        };
        const doMove2_ = () => {
            if (from2Piece && target2Pos) {
                return from2Piece.actions.moveTo({
                    pos: target2Pos,
                    duration: overallDuration,
                    easing: EasingFunctions.EaseOutQuad
                }).toPromise().then(() => {
                    this.pieces[move.from2!.row][move.from2!.col] = undefined;
                    this.pieces[move.to2!.row][move.to2!.col] = from2Piece;
                });
            }
            return Promise.resolve();
        };
        let doHaloBlink_ = () => Promise.resolve();
        if (toPiece) { // piece to capture
            const halo = this.dotOrHalo(move.to.row, move.to.col);
            doHaloBlink_ = () => halo.actions.blink(blinkPeriod, blinkPeriod, numBlinks).toPromise();
        }
        await doTilt_();
        await Promise.all([doHaloBlink_()]);
        await Promise.all([doMove_(), doMove2_()]);
        await doTiltBack_();
        let useFromPiece = fromPiece;
        if (move.promotion) {
            const pieceTargetDim = this.config.squareDim - 8;
            const actor = new Actor({});
            actor.graphics.use(getSpriteFromFenLetter(ss, move.promotion, pieceTargetDim));
            this.removeChild(fromPiece);
            this.place(actor, move.to.row, move.to.col); // incidentally sets pieces[][] but we'll set it again below
            useFromPiece = actor; // !!!
        }
        if (toPiece) {
            this.removeChild(toPiece);
        }
        if (killPiece) {
            this.removeChild(killPiece);
        }
        this.pieces[move.from.row][move.from.col] = undefined;
        this.pieces[move.to.row][move.to.col] = useFromPiece;
        useFromPiece.z = 50;
        this.clearHighlightAndDotsAndHalos();
    }

}
