export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const suits = ['Heart', 'Diamond', 'Club', 'Spade'] as const;

export type Rank = typeof ranks[number];
export type Suit = typeof suits[number];

export type Card = {
    suit: Suit,
    rank: Rank
};
