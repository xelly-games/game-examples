import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata,
    XellyPixelScheme
} from '@xelly/xelly.js';
import {Engine} from 'excalibur';
import {MyLevel} from './level';

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Interactive,
    pixelScheme: XellyPixelScheme.Px2_0
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const level = new MyLevel();
    engine.addScene('root', level);
};
