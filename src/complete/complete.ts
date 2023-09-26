import { inputToList } from "../distance/calc-distance-util";
import {
  CompleteData,
  PATTERN,
  TileType,
  resultPatternToData,
} from "./complete-util";

const sheetToPattern = (sheet: number[][], mCount: number) => {
  let result = 0;
  for (let j = 0; j < sheet.length; j++) {
    for (let k = 0; k < sheet[j].length; k++) {
      const shiftLen = 2 * sheet[j][k] - 1;
      result = (result << shiftLen) | ((1 << shiftLen) - 2);
    }
    result = (result << 1) + 2;
  }
  result = (result << 3) | mCount;
  return result;
};

export const processInput: (input: string) => {
  pattern: number;
  list: TileType[];
} = (input: string) => {
  const list = inputToList(input);
  const resultSheet: number[][] = [];
  let tempArray: number[] = [];
  let count = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i]) {
      tempArray.push(list[i]);
      count += list[i];
    } else if (tempArray.length) {
      resultSheet.push(tempArray);
      tempArray = [];
    }
  }
  if (tempArray.length) {
    resultSheet.push(tempArray);
  }
  const resultList: TileType[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list[i]; j++) {
      resultList.push(PATTERN[i]);
    }
  }
  // console.log(resultSheet, patternToSheet(sheetToPattern(resultSheet, Math.floor(count / 3))))
  if (count % 3 === 2) {
    return {
      pattern: sheetToPattern(resultSheet, Math.floor(count / 3)),
      list: resultList,
    };
  } else {
    return { pattern: 0, list: [] };
  }
};

export const searchCompleteResult = (
  input: string,
  data: Map<number, Set<number>>
) => {
  const { pattern, list } = processInput(input);
  const resultSet = data.get(pattern);
  let dataList: CompleteData[] = [];
  if (resultSet) {
    dataList = [...resultSet].map((e) => resultPatternToData(e));
  }
  return {
    list,
    data: dataList.map((e) => ({
      d: list[e.dPosition],
      s: e.sIndex.map((i) => list[i]),
      k: e.kIndex.map((i) => list[i]),
    })),
  };
};
