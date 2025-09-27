import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {
    Actor,
    Color,
    Engine,
    Font,
    FontUnit,
    Label,
    vec,
    Vector
} from 'excalibur';

const font24 = new Font({
    color: Color.Black,
    family: 'system-ui, sans-serif',
    unit: FontUnit.Px,
    size: 24
});

/** Metadata. */
export const metadata: XellyMetadata = {
    //type: XellyGameType.Passive
    type: XellyGameType.Realtime
};

const makeDraggable = (engine: Engine, actor: Actor) => {
    let dragOffset: Vector | undefined;
    actor.on('pointerdragstart', (event) => {
        dragOffset = event.screenPos.sub(actor.pos);
    });
    actor.on('pointerdragend', (event) => {
        dragOffset = undefined;
    });
    engine.input.pointers.primary.on('move', event => {
        // using top-level 'move' event gives better experience than
        //   actor.on('pointerdragmove', ...) in the case the
        //    pointer ends up not directly over actor during moving:
        if (dragOffset) {
            actor.pos = event.screenPos.sub(dragOffset)
        }
    });
    /*actor.on('pointerdragmove', (event) => {
        if (dragOffset) {
            actor.pos = event.screenPos.sub(dragOffset)
        }
    });
    engine.input.pointers.primary.on('down', event => {
        // no-op
    });
    engine.input.pointers.primary.on('up', event => {
        dragOffset = undefined;
    });*/
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const message = "Hello, world!";
    const messageDimensions = font24.measureText(message);
    const label = new Label({
        text: message,
        font: font24,
        pos: vec(
            (engine.drawWidth - messageDimensions.width) / 2,
            (engine.drawHeight - messageDimensions.height) / 2),
    });
    engine.add(label);
    makeDraggable(engine, label);
};
