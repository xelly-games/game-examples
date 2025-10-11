import {Engine, Vector} from 'excalibur';

export const installSwipeDownHandler_ = (engine: Engine, handler: (e: 'activated' | 'stopped') => void) => {
    let activated = false;
    let startPos: Vector | undefined = undefined;
    engine.input.pointers.primary.on('down', event => {
        startPos = event.screenPos;
    });
    engine.input.pointers.primary.on('move', event => {
        if (startPos && !activated && event.screenPos.y > startPos.y + 16/*!*/) {
            handler('activated');
            activated = true;
        }
    });
    engine.input.pointers.primary.on('up', event => {
        startPos = undefined;
        if (activated) {
            handler('stopped');
            activated = false;
        }
    });
};
