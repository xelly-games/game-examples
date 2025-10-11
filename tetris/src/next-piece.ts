import {
    Actor,
    CollisionType,
    Color,
    Graphic,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import {PieceI, PieceType} from './constants';
import {makePieceGraphic, Piece} from './piece';

const lightenFactor = 0.6;
const useBlockDim = 50;

const pieceGraphicCache = new Map<string, Graphic>();
const getPieceGraphic = (type: PieceType, themeColor: Color, graphicsScale: number) => {
    const got = pieceGraphicCache.get(type.name);
    if (got) {
        return got;
    }
    const g
        = makePieceGraphic(themeColor.lighten(lightenFactor), useBlockDim, type.blocks);
    g.scale = vec(graphicsScale, graphicsScale);
    pieceGraphicCache.set(type.name, g);
    return g;
};

export class NextPiece extends Actor {

    private child: Actor;
    private pieceType?: PieceType;
    private graphicsScale: number;

    constructor(themeColor: Color, dim: number) {
        super({
            anchor: Vector.Zero,
            color: themeColor
        });
        this.graphics.use(new Rectangle({
            width: dim,
            height: dim,
            color: Color.Transparent,
            strokeColor: themeColor.lighten(lightenFactor),
            lineWidth: 4
        }));
        this.body.collisionType = CollisionType.PreventCollision;
        this.graphics.isVisible = false;
        this.child = new Actor({
            anchor: Vector.Zero
        });
        this.addChild(this.child);
        const widestGraphic = makePieceGraphic(themeColor.lighten(lightenFactor),
            50/*arbitrary*/, PieceI.blocks);
        this.graphicsScale = 0.6 * (this.graphics.current!.width / widestGraphic.width);
    }

    setPieceType(pieceType: PieceType) {
        this.graphics.isVisible = true;
        if (pieceType.name === this.pieceType?.name) {
            return; // nothing to do
        }
        const graphic
            = getPieceGraphic(pieceType, this.color, this.graphicsScale);
        this.child.pos = vec(
            Math.floor((this.graphics.current!.width - graphic.width) / 2),
            Math.floor((this.graphics.current!.height - graphic.height) / 2));
        this.child.graphics.use(graphic);
    }

}
