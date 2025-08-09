import {Card, Suit} from './card-types';

export type PokerHand =
    | 'royal-flush'
    | 'straight-flush'
    | 'four-kind'
    | 'full-house'
    | 'flush'
    | 'straight'
    | 'three-kind'
    | 'two-pair'
    | 'one-pair'
    | 'high-card';

export function vibe_getPokerHand(cards: Card[]): PokerHand {
    if (cards.length !== 5)
        throw new Error('Must provide exactly 5 cards');

    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const rankCounts = new Map<string, number>();
    const suitCounts = new Map<Suit, number>();

    for (const {rank, suit} of cards) {
        rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
    }

    const isFlush = suitCounts.size === 1;

    const sortedRanks = cards
        .map(c => rankOrder.indexOf(c.rank))
        .sort((a, b) => a - b);

    const isStraight =
        sortedRanks.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1) ||
        // special case: A-2-3-4-5
        JSON.stringify(sortedRanks) === JSON.stringify([0, 1, 2, 3, 12]);

    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a).join(",");

    if (isFlush && isStraight && sortedRanks.includes(12)) return 'royal-flush';
    if (isFlush && isStraight) return 'straight-flush';
    if (counts === "4,1") return 'four-kind';
    if (counts === "3,2") return 'full-house';
    if (isFlush) return 'flush';
    if (isStraight) return 'straight';
    if (counts === "3,1,1") return 'three-kind';
    if (counts === "2,2,1") return 'two-pair';
    if (counts === "2,1,1,1") return 'one-pair';

    return 'high-card';
}

export const pokerHandScores = new Map<PokerHand, number>([
    ['royal-flush', 100],
    ['straight-flush', 75],
    ['four-kind', 50],
    ['full-house', 25],
    ['flush', 20],
    ['straight', 15],
    ['three-kind', 10],
    ['two-pair', 5],
    ['one-pair', 2],
    ['high-card', 0],
]);

// -- final score

type EndingRule = { min: number; msg: string };

const EndingRules: EndingRule[] = [
    { min: 200, msg: "Wow. How'd you do that?" },
    { min: 175, msg: "Stellar." },
    { min: 150, msg: "Now we are talking." },
    { min: 130, msg: "Pretty. Pretty. Pretty good." },
    { min: 120, msg: "Not bad." },
    { min: 100, msg: "About average." },
    { min: 50, msg: "Meh. Try again." },
    { min: 0, msg: "Yikes." },
];

export function endingMessage(score: number): string {
    return (EndingRules.find(r => score >= r.min) ?? EndingRules[EndingRules.length - 1]).msg;
}
