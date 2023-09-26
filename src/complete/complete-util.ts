export interface CompleteData {
  dPosition: number;
  sIndex: number[];
  kIndex: number[];
}
export const PATTERN = [
  "1m",
  "2m",
  "3m",
  "4m",
  "5m",
  "6m",
  "7m",
  "8m",
  "9m",
  ,
  ,
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  ,
  ,
  "1s",
  "2s",
  "3s",
  "4s",
  "5s",
  "6s",
  "7s",
  "8s",
  "9s",
  ,
  ,
  "1z",
  ,
  ,
  "2z",
  ,
  ,
  "3z",
  ,
  ,
  "4z",
  ,
  ,
  "5z",
  ,
  ,
  "6z",
  ,
  ,
  "7z",
] as const;
export type TileType = (typeof PATTERN)[number];

export const resultPatternToData: (input: number) => CompleteData = (
  input: number
) => {
  const sCount = (input & (7 << 23)) >> 23;
  const kCount = (input & (7 << 20)) >> 20;
  const dPosition = (input & (15 << 16)) >> 16;
  const positions = [12, 8, 4, 0].map((e) => (input & (15 << e)) >> e);
  const sIndex: number[] = [];
  const kIndex: number[] = [];
  for (let i = 0; i < sCount; i++) {
    sIndex.push(positions[i]);
  }
  for (let i = sCount; i < sCount + kCount; i++) {
    kIndex.push(positions[i]);
  }
  return { dPosition, sIndex, kIndex };
};

export const patternToSheet = (pattern: number) => {
  const count = (pattern & 7) * 3 + 2;
  let sum = 0;
  let rest = pattern >> 3;
  let list: number[] = [];
  const result: number[][] = [];
  while (sum < count) {
    let index = 1;
    while (rest & (1 << index)) {
      index++;
    }
    const count = Math.ceil(index / 2);
    const isBreak = index % 2 == 0;
    if (isBreak) {
      result.unshift(list);
      list = [];
    }
    list.unshift(count);
    sum += count;
    rest = rest >> index;
  }
  result.unshift(list);
  result.pop();
  return result;
};
