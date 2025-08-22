import {
    Actor,
    BoundingBox,
    Color,
    Engine,
    ImageSource,
    Rectangle,
    vec,
    Vector
} from 'excalibur';

const _createFilledRect = (
    width: number, height?: number, color: Color = Color.DarkGray, strokeColor: Color = Color.White, lineWidth: number = 2) => {
    return new Rectangle({
        quality: 4,
        width: width,
        height: height || width,
        lineWidth: lineWidth,
        strokeColor: strokeColor,
        color: color
    });
};

const _createOpenRect = (
    width: number, height?: number, color: Color = Color.DarkGray, lineWidth: number = 2, dashed: boolean = true) => {
    return new Rectangle({
        quality: 4,
        width: width,
        height: height || width,
        lineWidth: lineWidth,
        strokeColor: color,
        color: Color.Transparent,
        ...(dashed ? {lineDash: [2, 2]} : {})
    });
};

export const createUndoGraphicalButton = (engine: Engine, loadedImageSource: ImageSource, loadedWhiteImageSource: ImageSource) => {
    const sprite = loadedImageSource.toSprite();
    const whiteSprite = loadedWhiteImageSource.toSprite();
    const buttonPaddingX = 4;
    const buttonPaddingY = 4;
    const buttonMarginLeft = 4;
    const buttonMarginRight = 6;
    const buttonMarginY = 4;
    const buttonIconDim = 25;
    const useColor = Color.fromHex('#e9e9e9');
    const useOutlineStrokeWidth = 2;
    const undoButtonClickArea = new BoundingBox({
        top: 0,
        left: 0,
        right: buttonIconDim + buttonPaddingX * 2 + buttonMarginLeft + buttonMarginRight,
        bottom: buttonIconDim + buttonPaddingY * 2 + buttonMarginY * 2
    });
    const undoButton = new Actor({
        anchor: Vector.Zero,
        pos: vec(engine.drawWidth - undoButtonClickArea.height,
            engine.drawHeight - undoButtonClickArea.height),
        width: undoButtonClickArea.width,
        height: undoButtonClickArea.height,
        color: Color.Transparent
    });
    const undoButtonOutline = new Actor({
        anchor: Vector.Zero,
        pos: vec(buttonMarginLeft, buttonMarginY),
    });
    undoButtonOutline.graphics.add('outline',
        _createOpenRect(buttonIconDim + buttonPaddingX * 2,
            buttonIconDim + buttonPaddingY * 2,
            useColor, useOutlineStrokeWidth, false));
    undoButtonOutline.graphics.add('filled',
        _createFilledRect(buttonIconDim + buttonPaddingX * 2,
            buttonIconDim + buttonPaddingY * 2, useColor, Color.White,
            useOutlineStrokeWidth));
    undoButton.addChild(undoButtonOutline);
    const undoButtonIcon = new Actor({
        anchor: Vector.Zero,
        pos: vec(buttonPaddingX, buttonPaddingY),
        scale: vec(buttonIconDim / sprite.width, buttonIconDim / sprite.height)
    });
    undoButtonIcon.graphics.use(sprite);
    undoButtonOutline.addChild(undoButtonIcon);
    const undoButtonWhiteIcon = new Actor({
        anchor: Vector.Zero,
        pos: vec(buttonPaddingX, buttonPaddingY),
        scale: vec(buttonIconDim / sprite.width, buttonIconDim / sprite.height)
    });
    undoButtonWhiteIcon.graphics.use(whiteSprite);
    undoButtonOutline.addChild(undoButtonWhiteIcon);
// initially everything is hidden:
    const showAll = () => {
        undoButtonIcon.graphics.isVisible = true;
        undoButtonOutline.graphics.isVisible = true;
        undoButton.graphics.isVisible = true;
        undoButtonWhiteIcon.graphics.isVisible = false;
        undoButtonOutline.graphics.use('default');
    };
    showAll();
    undoButton.on('hideAll*', () => {
        undoButtonIcon.graphics.isVisible = false;
        undoButtonWhiteIcon.graphics.isVisible = false;
        undoButtonOutline.graphics.isVisible = false;
        undoButton.graphics.isVisible = false;
    });
    undoButton.on('showAll*', () => {
        showAll();
    });
    undoButton.on('pointerdown', () => {
        // -- flicker button --
        let cycle = 1;
        const cycleInterval = setInterval(() => {
            if (cycle === 1) {
                undoButtonIcon.graphics.isVisible = false;
                undoButtonWhiteIcon.graphics.isVisible = true;
                undoButtonOutline.graphics.use('filled');
            } else {
                undoButtonIcon.graphics.isVisible = true;
                undoButtonWhiteIcon.graphics.isVisible = false;
                undoButtonOutline.graphics.use('default');
            }
            cycle = 1 - cycle;
        }, 75);
        setTimeout(() => {
            clearInterval(cycleInterval);
            undoButtonIcon.graphics.isVisible = true;
            undoButtonWhiteIcon.graphics.isVisible = false;
            undoButtonOutline.graphics.use('default');
            undoButton.emit('press*');
        }, 151);
    });
    return undoButton;
};
