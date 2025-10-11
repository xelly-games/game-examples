import * as xel from '@xelly/xelly.js';
import {XellyPixelScheme} from '@xelly/xelly.js';
import {Actor, Color, vec, Vector} from 'excalibur';
import {Config} from './constants';
import {leftArrow} from './svg';
import {Button} from './button';

const createButtonOptions = (themeColor: Color) => {
    return {
        anchor: Vector.Zero,
        pixelScheme: XellyPixelScheme.Px2_0,
        font: 'font2' as const,
        color: themeColor,
        backgroundColor: Color.White,
        cssPosition: Config.DefaultButtonPadding,
        cssWidthAndHeightOverride:
            (dim: Vector) => dim.add(Config.DefaultButtonPadding).add(Config.DefaultButtonPadding),
        borderWidth: 2,
        borderColor: themeColor,
        borderRadius: 5
    };
};

const moveArrowAscii = `
        ##
       # #
      # #
     # #
    #  ###########
   #              #
    #  ###########
     # #
      # #
       # #
        ##
`;

const moveArrow2Ascii = `
        ####
       #   #
      #   #
     #   ######
    #         # 
   #          #
    #         #
     #   ###### 
      #   #
       #   #
        ####
`;

export const createMoveArrowButton = async (themeColor: Color, maxVisibleWidth: number, direction: 'left' | 'right') => {
    const imageSource = leftArrow(themeColor.lighten(0.1));
    return imageSource.load().then(() => {
        // const graphic = imageSource.toSprite();
        const graphic = xel.graphics.fromAscii(moveArrow2Ascii, [],
            {pixelScheme: XellyPixelScheme.Px3_0, color: themeColor, anchor: Vector.Zero,
                cssPosition: vec(16, 10),
                borderWidth: 2, borderColor: themeColor.lighten(0.5), borderRadius: 10,
                cssWidthAndHeightOverride: (dim: Vector) => dim.add(vec(32, 20))});
        const graphicDepressed = xel.graphics.fromAscii(moveArrow2Ascii, [],
            {pixelScheme: XellyPixelScheme.Px3_0, color: Color.White, backgroundColor: themeColor, anchor: Vector.Zero,
                cssPosition: vec(16, 10),
                borderWidth: 2, borderColor: themeColor.lighten(0.5), borderRadius: 10,
                cssWidthAndHeightOverride: (dim: Vector) => dim.add(vec(32, 20))});
        //graphic.scale = vec(maxVisibleWidth / graphic.width, maxVisibleWidth / graphic.height);
        if (direction === 'right') {
            graphic.flipHorizontal = true;
            graphicDepressed.flipHorizontal = true;
        }
        return new Button(themeColor, graphic, graphicDepressed,
            {
                top: Config.MoveArrowButtonVisiblePadding.y + Config.MoveArrowButtonInvisiblePadding.top,
                left: Config.MoveArrowButtonVisiblePadding.x + Config.MoveArrowButtonInvisiblePadding.left,
                right: Config.MoveArrowButtonVisiblePadding.x + Config.MoveArrowButtonInvisiblePadding.right,
                bottom: Config.MoveArrowButtonVisiblePadding.y + Config.MoveArrowButtonInvisiblePadding.bottom,
            });
    });
};

export const createRotateButton = (themeColor: Color, direction: 'left' | 'right') => {
    const child = direction === 'left'
        ? xel.actors.fromAscii(`
           ###
        # #   #
        ##     #
        ###    #
    `, [themeColor], createButtonOptions(themeColor))
        : xel.actors.fromAscii(`
          ###
         #   # #
        #     ##
        #    ###
    `, [themeColor], createButtonOptions(themeColor));
    const actor = new Actor({
        anchor: Vector.Zero,
        width: child.graphics.current!.width + (Config.RotateButtonVisiblePadding.x + Config.RotateButtonInvisiblePadding.x) * 2,
        height: child.graphics.current!.height + (Config.RotateButtonVisiblePadding.y + Config.RotateButtonInvisiblePadding.y) * 2,
        color: Color.Transparent // so we get a graphic that can be measured by caller
    });
    child.pos = vec(Config.RotateButtonInvisiblePadding.x, Config.RotateButtonInvisiblePadding.y);
    actor.addChild(child);
    return actor;
};
