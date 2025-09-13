import {
    XellyContext,
    XellyGameType,
    XellyInstallFunction,
    XellyMetadata
} from '@xelly/xelly.js';
import {Color, Engine, Font, FontUnit, Label, vec} from 'excalibur';

const font24 = new Font({
    color: Color.Black,
    family: 'system-ui, sans-serif',
    unit: FontUnit.Px,
    size: 24
});

/** Metadata. */
export const metadata: XellyMetadata = {
    type: XellyGameType.Passive
};

/** Install. */
export const install: XellyInstallFunction = (context: XellyContext, engine: Engine) => {
    const message = "Hello, world!";
    const messageDimensions = font24.measureText(message);
    engine.add(new Label({
        text: message,
        font: font24,
        pos: vec(
            (engine.drawWidth - messageDimensions.width) / 2,
            (engine.drawHeight - messageDimensions.height) / 2),
    }));
};
