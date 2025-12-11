import {Color, Engine, Font, FontUnit, Label, vec, Vector} from 'excalibur';

const font16 = new Font({
    color: Color.Black,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    unit: FontUnit.Px,
    size: 16
});

const margin = 5;

const toMessage = (skillValue: number) => `Skill: ${skillValue}`;

export const createSkillPicker = (engine: Engine, initialSkillLevel: number) => {
    let skill = initialSkillLevel;
    const measurableText = toMessage(20);
    const m = font16.measureText(measurableText);
    const label = new Label({
        text: `Skill: ${skill}`,
        font: font16,
        anchor: Vector.Right,
        pos: vec(engine.drawWidth - m.width - margin, margin),
    });
    label.on('pointerdown', () => {
        skill = (skill + 1) % 21;
        label.text = `Skill: ${skill}`;
        label.emit('*skill', skill);
    });
    engine.add(label);
    return label;
};
