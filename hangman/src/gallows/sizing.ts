export const SizingRatios = {
    BaseWidthPercent: 1 / 2,
    CrossBeamWidthPercent: 1 / 2,

    CrossBeamDropHeightPercent: 1 / 6,

    BodyWidthPercent: 1 / 3,
    BodyTorsoPercentOfBodyBelowNeck: 1 / 1.3,
    BodyGapBelowFeetPercentOfTotalBelowDrop: 1 / 4,

    BodyArmOffsetBelowHeadPercentOfTorso: 1 / 3,
    BodyArmLengthPercentOfBodyHeight: 1 / 4,
} as const;

export type Sizings = {
    readonly thickness: number;
    readonly baseWidth: number;
    readonly uprightHeight: number;
    readonly dropHeight: number;
    readonly crossBeamWidth: number;
    readonly crossBeamOffsetX: number;
    readonly totalBelowDropHeight: number;
    readonly headWidth: number;
};
