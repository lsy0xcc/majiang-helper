import { fromByteArray, toByteArray } from "base64-js";

export const compareList = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    return b.length - a.length;
  } else {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return b[i] - a[i];
      }
    }
    return 0;
  }
};

export const toSortedSheet = (input: number[][]) => {
  for (let i = 0; i < input.length; i++) {
    const reversed = [...input[i]].reverse();
    if (compareList(reversed, input[i]) < 0) {
      input[i] = reversed;
    }
  }
  return input.sort(compareList);
};

export const sheetToPattern = (input: number[][]) => {
  return toSortedSheet(input)
    .map((list) => list.join(","))
    .join(" ")
    .replaceAll(",0,", ";");
};

export const patternToSheet = (pattern: string) => {
  return pattern.split(" ").map((e) =>
    e
      .replaceAll(";", ",0,")
      .split(",")
      .map((char) => parseInt(char))
  );
};

export const inputToSheet: (input: string) => number[][] = (input: string) =>
  listToSheet(inputToList(input));

export const inputToList: (input: string) => number[] = (input: string) => {
  // [1m, ..., 9m, 0, 0, 1s, ..., 9s, 0, 0, 1p, ..., 9p, 0, 0, 1z, 0, 0, 2z, ...]
  const result = new Array(52).fill(0);
  const matchResult = input.matchAll(/\d+[mpsz]/g);

  for (let match of matchResult) {
    const list = match[0].split("");
    const type = list[list.length - 1]; // get type
    for (let i = 0; i < list.length - 1; i++) {
      const e = parseInt(list[i] === "0" ? "5" : list[i]);
      switch (type) {
        case "m":
          result[e - 1]++;
          break;
        case "s":
          result[e + 10]++;
          break;
        case "p":
          result[e + 21]++;
          break;
        case "z":
          result[3 * (e + 10)]++;
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    if (i >= 52) {
      // prevent 8z 9z
      return [];
    }
    if (result[i] > 4) {
      // prevent more than 4
      return [];
    }
  }
  return result;
};

export const listToSheet = (input: number[]) => {
  const result = [];
  let tempArray = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i]) {
      tempArray.push(input[i]);
    } else {
      if (input[i + 1] && tempArray.length) {
        tempArray.push(input[i]);
      } else {
        if (tempArray.length) {
          result.push(tempArray);
          tempArray = [];
        }
      }
    }
  }
  if (tempArray.length) {
    result.push(tempArray);
  }
  return result;
};

export const numberListToUInt8Array = (input: number[]) => {
  const rest = (4 - (input.length % 4)) % 4;
  for (let i = 0; i < rest; i++) {
    input.push(0b00);
  }
  const resultArray = new Uint8Array((input.length + rest) / 4);
  for (let i = 0; i < input.length; i += 4) {
    resultArray[i >> 2] =
      (input[i] << 6) |
      (input[i + 1] << 4) |
      (input[i + 2] << 2) |
      input[i + 3];
  }
  return resultArray;
};

export const sheetToBase64Pattern = (input: number[][]) => {
  const result: number[] = [];
  const sortedSheet = toSortedSheet(input);
  for (let i = 0; i < sortedSheet.length; i++) {
    let j = 0;
    while (j < sortedSheet[i].length - 1) {
      result.push(sortedSheet[i][j] - 1);
      if (sortedSheet[i][j + 1] > 0) {
        result.push(0b00);
        j += 1;
      } else {
        result.push(0b01);
        j += 2;
      }
    }
    result.push(sortedSheet[i][sortedSheet[i].length - 1] - 1);
    result.push(0b10);
  }
  result[result.length - 1] = 0b11;
  return fromByteArray(numberListToUInt8Array(result));
};

export const base64PatternToSheet = (input: string) => {
  const result = [];
  let list = [];
  const numberList = [...toByteArray(input)]
    .map((e) => [(e >> 6) & 0b11, (e >> 4) & 0b11, (e >> 2) & 0b11, e & 0b11])
    .flat();
  for (let i = 0; i < numberList.length; i += 2) {
    const count = numberList[i];
    const gap = numberList[i + 1];
    list.push(count + 1);
    if (gap === 1) {
      list.push(0);
    } else if (gap === 2) {
      result.push(list);
      list = [];
    } else if (gap === 3) {
      break;
    }
  }
  result.push(list);
  return result;
};
