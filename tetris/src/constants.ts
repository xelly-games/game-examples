import {BoundingBox, Color, vec} from 'excalibur';

export const Config = {
    Rows: 20,
    Cols: 10,
    GridLineColor: Color.fromHex('#F0F0F0'),
    MinGridMargin: 6,
    MaxLeftRightButtonWidth: 45,
    BlockSpacing: 2,
    PieceBlockBorder: 6,
    PieceInnerBlockMargin: 6,
    // -- buttons --
    DefaultButtonMargin: vec(5, 5),
    DefaultButtonPadding: vec(10, 8),
    RotateButtonVisiblePadding: vec(0, 0),
    RotateButtonInvisiblePadding: vec(26, 12),
    MoveArrowButtonVisiblePadding: vec(4, 16),
    MoveArrowButtonInvisiblePadding: { top: 0, right: 26, bottom: 0, left: 26}, // invisible for clicking
    // --
    BaseTimerInterval: 1000,
    // --
    NextPieceMargin: vec(10, 10),

} as const;

export type PieceType = { name: string, blocks: number[][] };

export const PieceI = {
    name: 'I',
    blocks: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
};

export const Pieces: PieceType[] = [
    PieceI,
    {
        name: 'J',
        blocks: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
    },
    {
        name: 'L',
        blocks: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
    },
    {
        name: 'O',
        blocks: [
            [1, 1],
            [1, 1],
        ],
    },
    {
        name: 'S',
        blocks: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
    },
    {
        name: 'T',
        blocks: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
    },
    {
        name: 'Z',
        blocks: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
    },
];
