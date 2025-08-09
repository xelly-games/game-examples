import * as xel from '@xelly/xelly.js';
import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Engine, vec} from 'excalibur';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Passive
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const message = xel.actors.fromText(context,
        ':)', {},
        xel.actorArgs.fromPixelBasedArgs(context, {
            pos: vec((context.screen.pixel.width / 2), context.screen.pixel.height / 2)
        }));
    engine.add(message);
};
