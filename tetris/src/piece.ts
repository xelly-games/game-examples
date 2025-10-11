import {
    Actor,
    Color,
    Graphic,
    GraphicsGroup,
    GraphicsGrouping,
    Rectangle,
    vec,
    Vector
} from 'excalibur';
import {Config} from './constants';
import {areEqual, rotate} from './util';

export const makePieceBlock = (color: Color, blockDim: number): Graphic => {
    return new GraphicsGroup({
            members: [
                {
                    graphic: new Rectangle({
                        width: blockDim,
                        height: blockDim,
                        color: Color.Transparent,
                        strokeColor: color,
                        lineWidth: Config.PieceBlockBorder
                    }),
                    offset: vec(0, 0)
                },
                {
                    graphic: new Rectangle({
                        width: blockDim - Config.PieceInnerBlockMargin * 2,
                        height: blockDim - Config.PieceInnerBlockMargin * 2,
                        color: color.lighten(0.1)
                    }),
                    offset: vec(Config.PieceInnerBlockMargin, Config.PieceInnerBlockMargin)
                }
            ]
        }
    );
};

export const makePieceGraphic = (colorTheme: Color, blockDim: number, piece: number[][]) => {
    const graphics: GraphicsGrouping[] = [];
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col] === 1) {
                graphics.push({
                    graphic: makePieceBlock(piece[row][col] === 1 ? colorTheme : Color.Transparent, blockDim),
                    offset: vec(col * (blockDim + Config.BlockSpacing), row * (blockDim + Config.BlockSpacing))
                });
            }
        }
    }
    return new GraphicsGroup({members: graphics});
};

export class Piece extends Actor {

    private rotations: number[][][] = [];
    private currentRotation;
    private readonly child: Actor;

    constructor(colorTheme: Color, blockDim: number, piece: number[][]) {
        super({
            anchor: Vector.Zero,
        });
        this.rotations.push(piece);
        this.child = new Actor({
            anchor: Vector.Zero,
        });
        this.child.graphics.add('rot0', makePieceGraphic(colorTheme, blockDim, piece));
        for (let i = 0; i < 10/*safety*/; ++i) {
            const rot = rotate(this.rotations[this.rotations.length - 1]);
            if (areEqual(rot, piece)) {
                break;
            }
            this.rotations.push(rot);
            this.child.graphics.add(`rot${this.rotations.length - 1}`,
                makePieceGraphic(colorTheme, blockDim, rot));
        }
        this.currentRotation = 0;
        this.child.graphics.use(`rot${this.currentRotation}`);
        this.addChild(this.child);

        /*this.graphics.use(new Rectangle({
            width: child.graphics.current!.width,
            height: child.graphics.current!.height,
            strokeColor: Color.Red,
            color: Color.Transparent,
            lineWidth: 1
        }));*/
    }

    reset() {
        this.currentRotation = 0;
        this.child.graphics.use('rot0');
    }

    asMatrix(): number[][] {
        return this.rotations[this.currentRotation];
    }

    rotate(direction: number) {
        const nextRotation = this.currentRotation + direction;
        this.currentRotation = nextRotation < 0 ? this.rotations.length - 1 : nextRotation % this.rotations.length;
        this.child.graphics.use(`rot${this.currentRotation}`);
    }

}
