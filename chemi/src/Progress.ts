import { Raster, RasterOptions } from 'excalibur';

export interface ProgressOptions {
    width: number;
}

/**
 * A Rectangle {@apilink Graphic} for drawing rectangles to the {@apilink ExcaliburGraphicsContext}
 */
export class Progress extends Raster {
    constructor(options: RasterOptions & ProgressOptions) {
        super(options);
        this.width = options.width;
        this.height = options.lineWidth || 0;
        this.rasterize();
    }

    public clone(): Progress {
        return new Progress({
            width: this.width,
            ...this.cloneGraphicOptions(),
            ...this.cloneRasterOptions()
        });
    }

    execute(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width, 0);
        ctx.stroke();
    }
}
