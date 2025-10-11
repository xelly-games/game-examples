import {
    Actor, Color,
    GraphicsGroup,
    GraphicsGrouping,
    Line,
    vec,
    Vector
} from 'excalibur';
import {Config} from './constants';
import {makePieceBlock} from './piece';
import {removeRow_} from './util';

export class Grid extends Actor {

    readonly blockPixelDim: number;
    readonly blocks: (Actor | undefined)[][];

    constructor(themeColor: Color, maxDim: Vector) {
        super({
            anchor: Vector.Zero,
            color: themeColor
        });
        this.blockPixelDim = Math.min(
            Math.floor((maxDim.x - Config.Cols * (Config.BlockSpacing + 1)) / Config.Cols),
            Math.floor((maxDim.y - Config.Rows * (Config.BlockSpacing + 1)) / Config.Rows));
        this.blocks = Array.from({length: Config.Rows}, () => Array(Config.Cols).fill(undefined));
        const height = this.blockPixelDim * Config.Rows + Config.BlockSpacing * Config.Rows + Config.BlockSpacing;
        const width = this.blockPixelDim * Config.Cols + Config.BlockSpacing * Config.Cols + Config.BlockSpacing;
        const graphics: GraphicsGrouping[] = [];
        for (let row = 0; row <= Config.Rows; row++) {
            graphics.push({
                graphic: new Line({
                    color: Config.GridLineColor,
                    thickness: Config.BlockSpacing,
                    start: vec(0, 0),
                    end: vec(width, 0)
                }),
                offset: vec(0,
                    row * (this.blockPixelDim + Config.BlockSpacing) + Math.round(Config.BlockSpacing / 2))
            });
        }
        for (let col = 0; col <= Config.Cols; col++) {
            graphics.push({
                graphic: new Line({
                    color: Config.GridLineColor,
                    thickness: Config.BlockSpacing,
                    start: vec(0, 0),
                    end: vec(0, height)
                }),
                offset: vec(col * (this.blockPixelDim + Config.BlockSpacing) + Math.round(Config.BlockSpacing / 2),
                    0)
            });
        }
        this.graphics.use(new GraphicsGroup({members: graphics}));
    }

    clear() {
        for (let row = 0; row < this.blocks.length; row++) {
            for (let col = 0; col < this.blocks[row].length; col++) {
                if (this.blocks[row][col]) {
                    this.blocks[row][col]?.kill();
                    this.blocks[row][col] = undefined;
                }
            }
        }
    }

    addBlock(row: number, col: number) {
        if (this.blocks[row][col]) { // unexpected
            this.removeChild(this.blocks[row][col]);
        }
        const graphic
            = makePieceBlock(this.color, this.blockPixelDim);
        const actor = new Actor({
            anchor: Vector.Zero,
            pos: vec(
                col * (this.blockPixelDim + Config.BlockSpacing) + Config.BlockSpacing,
                row * (this.blockPixelDim + Config.BlockSpacing) + Config.BlockSpacing)
        });
        actor.graphics.use(graphic);
        this.blocks[row][col] = actor;
        this.addChild(actor);
    }

    removeRows(rows: number[]) {
        if (rows.length === 0) {
            return Promise.resolve();
        }
        const proms = [];
        for (const row of rows) {
            for (let col = 0; col < Config.Cols; col++) {
                if (this.blocks[row][col]) {
                    proms.push(this.blocks[row][col]!.actions.blink(100, 100, 2).toPromise());
                }
            }
        }
        return Promise.all(proms).then(() => {
            for (let r = 0; r < this.blocks.length; r++) {
                for (let c = 0; c < this.blocks[r].length; c++) {
                    if (this.blocks[r][c]) {
                        this.blocks[r][c]!.kill();
                    }
                }
            }
            for (const row of rows) { // expect rows in-order
                removeRow_(this.blocks, row, undefined);
            }
            for (let r = 0; r < this.blocks.length; r++) {
                for (let c = 0; c < this.blocks[r].length; c++) {
                    if (this.blocks[r][c]) {
                        this.addBlock(r, c);
                    }
                }
            }
        });
    }

}
