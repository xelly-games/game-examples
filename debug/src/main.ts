import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Engine, Scene, Timer, vec, Vector} from 'excalibur';
import {sentence} from '@ndaidong/txtgen';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Passive
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const padding = 2; // in xelly pixels
    const spawn = (name: string, xStart: 'left' | 'right', yPos: number, xVel: number) => {
        const message = xel.actors.fromText(
            context, sentence(),
            xStart === 'left' ? {
                    fgColor: 'negative', bgColor: 'positive', bgAlpha: 1,
                    spritePadding: padding,
                    positioning: {
                        anchor: vec(0.5, 0.5),
                        fractionalOffset: vec(0.5, 0.5)
                    }
                } :
                {
                    font: 'font2'
                },
            xel.actorArgs.fromPixelBasedArgs(context, {
                pos: vec(0/*will set just below*/, yPos),
                vel: vec(xVel, 0),
                // doesn't need pixel-based args treatment but can still use here
                name,
                anchor: Vector.Zero
            }));
        message.pos.x = xStart === 'left' ? -message.width : context.screen.css.width;
        message.on('postupdate', () => {
            if (xVel < 0 && (message.pos.x + message.width < 0)
                || xVel > 0 && (message.pos.x > engine.drawWidth)) {
                message.kill();
                engine.remove(message);
                spawn(name, xStart, yPos, xVel);
            }
        });
        engine.add(message);
    };

    const rowHeight = xel.sprites.height(xel.create.label('a')) + padding * 2;
    const marginy = 1;
    const rows = Math.floor((context.screen.pixel.height - marginy) / (rowHeight + marginy));
    const trueHeight = rows * (rowHeight + marginy) + marginy;
    const offsety = Math.floor((context.screen.pixel.height - trueHeight) / 2);

    for (let row = 0; row < rows; ++row) {
        if (row % 2 === 0) {
            spawn(`message-${row}`, 'left', offsety + row * (rowHeight + marginy), 25);
        } else {
            spawn(`message-${row}`, 'right', offsety + row * (rowHeight + marginy), -25);
        }
    }

    const titleScene = new Scene();
    const title1 = xel.actors.fromText(context, 'xelly.games',
        {
            font: 'font2',
            fgColor: 'negative',
            bgColor: 'positive',
            bgAlpha: 1,
            spritePadding: padding,
            positioning: {
                anchor: vec(0.5, 0.5),
                fractionalOffset: vec(0.5, 0.5)
            }
        },
        xel.actorArgs.fromPixelBasedArgs(context, {
            pos: vec((context.screen.pixel.width / 2), context.screen.pixel.height / 2 - 10)
        }));
    const title2 = xel.actors.fromText(context, 'xelly.games',
        {
            fgColor: 'negative',
            bgColor: 'positive',
            bgAlpha: 1,
            spritePadding: padding,
            positioning: {
                anchor: vec(0.5, 0.5),
                fractionalOffset: vec(0.5, 0.5)
            }
        },
        xel.actorArgs.fromPixelBasedArgs(context, {
            pos: vec((context.screen.pixel.width / 2), context.screen.pixel.height / 2 + 10)
        }));
    titleScene.add(title1);
    titleScene.add(title2);
    engine.addScene('title', titleScene);
    // 'xelly:start' gives a signal into first start of game. though game may
    //   be stopped and started subsequently due to scrolling on/off-screen, e.g.
    engine.on('xelly:start', () => {
        engine.goToScene('title');
        // todo setInterval - what about game start/stop ... Timer? but Timers are per scene??
        // @see https://excaliburjs.com/docs/timers/
        setInterval(() => {
            if (engine.currentSceneName === 'title') {
                engine.goToScene('root');
            } else {
                engine.goToScene('title');
            }
        }, 5000);
    });
};
