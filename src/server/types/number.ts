type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

export type NumberRange<Max extends number, Min extends number = 1> =
  | Exclude<Enumerate<Max>, Enumerate<Min>>
  | Max;

export type Dice = 20 | 12 | 10 | 8 | 6 | 4;

export type DieRollRange<Max extends Dice, Min extends number = 1> =
  | Exclude<Enumerate<Max>, Enumerate<Min>>
  | Max;

export type D20 = DieRollRange<20>;
export type D12 = DieRollRange<12>;
export type D10 = DieRollRange<10>;
export type D8 = DieRollRange<8>;
export type D6 = DieRollRange<6>;
export type D4 = DieRollRange<4>;
