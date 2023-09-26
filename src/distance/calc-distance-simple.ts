import { listToSheet } from "./calc-distance-util";

interface DistanceRecord extends RecordResult {
  sheet: number[][];
}
interface RecordResult {
  k: number;
  s: number;
  d: number;
  l: number;
  q: number;
  target: number;
}

const clone2DArray = (input: number[][]) => input.map((e) => [...e]);
// if a list has two adjacent 0s，split the array from there

// for a 2D array, process every list, and flat them to keep shape as before
const processSheet = (input: number[][]) => input.map(listToSheet).flat();

// the wrapper function
export const calcDistanceSimple = (sheet?: number[][]) => {
  if (!sheet?.length) {
    return -1;
  }
  const sum = (arr: number[]) => arr.reduce((prev, curr) => prev + curr);
  const total = sum(sheet.map(sum));
  if (total % 3 !== 2) {
    return -1;
  }
  const target = (total + 1) / 3;
  let min = Number.MAX_SAFE_INTEGER;
  const calcResult = calc({
    sheet,
    k: 0,
    s: 0,
    d: 0,
    l: 0,
    q: 0,
    target: target,
  });
  for (let i = 0; i < calcResult.length; i++) {
    const distance = calcDistanceByRecord(calcResult[i]);
    if (distance < min) {
      min = distance;
    }
  }
  return min;
};

// calc the distance
const calcDistanceByRecord = (input: RecordResult) => {
  const { s, k, d, l, q, target } = input;
  return (
    2 * target -
    1 -
    2 * (s + k) -
    (s + k + l + d + q >= target
      ? target - s - k - (!d as unknown as number)
      : d + l + q)
  );
};

// calculate
const calc: (input: DistanceRecord) => DistanceRecord[] = (
  input: DistanceRecord
) => {
  if (input.k + input.s + input.d + input.l + input.q >= input.target) {
    return [input];
  }
  const tempList = [
    ...minusK(input),
    ...minusS(input),
    ...minusD(input),
    ...minusL(input),
    ...minusQ(input),
  ];
  return tempList.length
    ? tempList
        .map((e) => ({ ...e, sheet: processSheet(e.sheet) }))
        .map((e) => calc(e))
        .flat()
    : [input];
};

const minusK = (input: DistanceRecord) => {
  const result: DistanceRecord[] = [];
  input.sheet.forEach((line, lineIndex) => {
    line.forEach((item, itemIndex) => {
      if (item >= 3) {
        const newSheet = clone2DArray(input.sheet);
        newSheet[lineIndex][itemIndex] = input.sheet[lineIndex][itemIndex] - 3;
        result.push({
          ...input,
          sheet: newSheet,
          k: input.k + 1,
        });
      }
    });
  });
  return result;
};
const minusS = (input: DistanceRecord) => {
  const result: DistanceRecord[] = [];
  input.sheet.forEach((line, lineIndex) => {
    line.forEach((_item, itemIndex) => {
      if (line[itemIndex] && line[itemIndex + 1] && line[itemIndex + 2]) {
        const newSheet = clone2DArray(input.sheet);
        newSheet[lineIndex][itemIndex] = input.sheet[lineIndex][itemIndex] - 1;
        newSheet[lineIndex][itemIndex + 1] =
          input.sheet[lineIndex][itemIndex + 1] - 1;
        newSheet[lineIndex][itemIndex + 2] =
          input.sheet[lineIndex][itemIndex + 2] - 1;
        result.push({
          ...input,
          sheet: newSheet,
          s: input.s + 1,
        });
      }
    });
  });
  return result;
};
const minusD = (input: DistanceRecord) => {
  const result: DistanceRecord[] = [];
  input.sheet.forEach((line, lineIndex) => {
    line.forEach((item, itemIndex) => {
      if (item >= 2) {
        const newSheet = clone2DArray(input.sheet);
        newSheet[lineIndex][itemIndex] = input.sheet[lineIndex][itemIndex] - 2;
        result.push({
          ...input,
          sheet: newSheet,
          d: input.d + 1,
        });
      }
    });
  });
  return result;
};
const minusL = (input: DistanceRecord) => {
  const result: DistanceRecord[] = [];
  input.sheet.forEach((line, lineIndex) => {
    line.forEach((_item, itemIndex) => {
      if (line[itemIndex] && line[itemIndex + 1]) {
        const newSheet = clone2DArray(input.sheet);
        newSheet[lineIndex][itemIndex] = input.sheet[lineIndex][itemIndex] - 1;
        newSheet[lineIndex][itemIndex + 1] =
          input.sheet[lineIndex][itemIndex + 1] - 1;
        result.push({
          ...input,
          sheet: newSheet,
          l: input.l + 1,
        });
      }
    });
  });
  return result;
};
const minusQ = (input: DistanceRecord) => {
  const result: DistanceRecord[] = [];
  input.sheet.forEach((line, lineIndex) => {
    line.forEach((_item, itemIndex) => {
      if (line[itemIndex] && line[itemIndex + 2]) {
        const newSheet = clone2DArray(input.sheet);
        newSheet[lineIndex][itemIndex] = input.sheet[lineIndex][itemIndex] - 1;
        newSheet[lineIndex][itemIndex + 2] =
          input.sheet[lineIndex][itemIndex + 2] - 1;
        result.push({
          ...input,
          sheet: newSheet,
          q: input.q + 1,
        });
      }
    });
  });
  return result;
};
