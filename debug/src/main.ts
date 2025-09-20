import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Actor, Color, Engine, Scene, vec, Vector} from 'excalibur';
import {sentence} from '@ndaidong/txtgen';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Passive
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const cssRibbonPadding = 10;
    const cssRibbonMarginY = 4;
    const spawn = (name: string, yPos: number, xVel: number) => {
        const message = new Actor({
            name,
            anchor: Vector.Zero
        });
        const paddingFn
            = (cssWidthAndHeight: Vector) => vec(cssWidthAndHeight.x + 6, cssWidthAndHeight.y + cssRibbonPadding);
        if (xVel > 0) {
            const graphic = xel.graphics.fromText(sentence(), {
                font: 'font2',
                color: Color.ExcaliburBlue,
                cssWidthAndHeightOverride: paddingFn});
            message.graphics.use(graphic);
            message.pos = vec(-graphic.width, yPos);
            message.vel.x = xVel;
        } else {
            message.graphics.use(xel.graphics.fromText(sentence(), {
                color: Color.White,
                backgroundColor: Color.Viridian,
                cssWidthAndHeightOverride: paddingFn
            }));
            message.pos = vec(engine.drawWidth, yPos);
            message.vel.x = xVel;
        }
        message.on('postupdate', () => {
            if (xVel < 0 && (message.pos.x + message.graphics.current!.width < 0)
                || xVel > 0 && (message.pos.x > engine.drawWidth)) {
                message.kill();
                engine.remove(message);
                spawn(name, yPos, xVel);
            }
        });
        engine.add(message);
    };

    // create a graphic just to measure the height of the sprite in "real"/css pixels:
    const cssRowHeight = xel.graphics.fromText('a').height + cssRibbonPadding * 2;
    const rows = Math.floor((engine.drawHeight - cssRibbonMarginY) / (cssRowHeight + cssRibbonMarginY));
    const trueHeight = rows * (cssRowHeight + cssRibbonMarginY) + cssRibbonMarginY;
    const offsety = Math.floor((engine.drawHeight - trueHeight) / 2);

    // kick things off in the scene:
    for (let row = 0; row < rows; ++row) {
        if (row % 2 === 0) {
            spawn(`message-${row}`, offsety + row * (cssRowHeight + cssRibbonMarginY), 75);
        } else {
            spawn(`message-${row}`, offsety + row * (cssRowHeight + cssRibbonMarginY), -75);
        }
    }

    // -- titles --
    const titleScene = new Scene();
    const title1 = new Actor();
    title1.graphics.use(xel.graphics.fromSpriteArray(
        xel.create.label('xelly.games', {font: 'font2'}), {
            color: Color.White,
            backgroundColor: Color.ExcaliburBlue,
            // add some "padding":
            cssWidthAndHeightOverride: (spriteWidthAndHeight) =>
                vec(spriteWidthAndHeight.x + 16, spriteWidthAndHeight.y + 10)
        }));
    const title2 = new Actor();
    title2.graphics.use(xel.graphics.fromSpriteArray(
        xel.create.label('xelly.games'), {
            color: Color.White,
            backgroundColor: Color.Viridian,
            cssWidthAndHeightOverride: (spriteWidthAndHeight) =>
                vec(spriteWidthAndHeight.x + 16, spriteWidthAndHeight.y + 10)
        }));
    title1.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2 - 20);
    title2.pos = vec(engine.drawWidth / 2, engine.drawHeight / 2 - 20 + title1.graphics.current!.height + 10);
    titleScene.add(title1);
    titleScene.add(title2);
    engine.addScene('title', titleScene);

    // 'xelly:start' gives a signal into first start of game. though game may
    //   be stopped and started subsequently due to scrolling on/off-screen, e.g.
    engine.on('xelly:start', () => {
        engine.goToScene('title');
        const switchScene = () => {
            const currIsTitleScene = engine.currentSceneName === 'title';
            engine.goToScene(currIsTitleScene ? 'root' : 'title');
            setTimeout(switchScene, currIsTitleScene ? 7000 : 2500);
        };
        switchScene();
    });
};
