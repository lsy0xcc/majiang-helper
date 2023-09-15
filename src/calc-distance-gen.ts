import * as readline from "readline";
import * as fs from "node:fs/promises";
import { compareList, sheetToPattern } from "./calc-distance-util";
import { calcDistance } from "./calc-distance";

// decompose the input to a sum af a list of number
const generateCount = (input: number, maxCount: number) => {
  const resultList: number[][][] = [[[0]]];
  for (let i = 1; i <= input; i++) {
    let newSolution: number[][] = [];
    for (let j = 1; j <= maxCount; j++) {
      newSolution = newSolution.concat(pushNewCount(j, i, resultList));
    }
    resultList.push(newSolution);
  }
  return resultList.map((e2) =>
    e2.map((e1) => {
      e1.shift();
      return e1;
    })
  );
};

const pushNewCount = (
  addNumber: number,
  currentNumber: number,
  resultList: number[][][]
) => {
  const baseNumber = currentNumber - addNumber;
  if (baseNumber < 0) {
    return [];
  } else {
    return resultList[baseNumber].map((e) => [...e, addNumber]);
  }
};

// generate the gap of each number
const generateGap = (input: number, type: number) => {
  const result = [[[0]]];
  for (let i = 1; i <= input; i++) {
    result[i] = pushNewGap(result[i - 1], type);
  }
  return result.map((e2) =>
    e2.map((e1) => {
      e1.shift();
      return e1;
    })
  );
};

const pushNewGap = (prevList: number[][], type: number) => {
  return prevList
    .map((list) => [...new Array(type).keys()].map((add) => [...list, add]))
    .flat();
};

// return the map of all result, key is pattern and value is distance
const generateResultMap = (len: number, useShortCut = false) => {
  let sum = 0;
  const startTime = new Date().getTime();
  const total = 1292059;
  // { patternSum: 1292059, calcSum: 1058213 }
  const allSmallerCount = [];
  let curr = 2;
  while (curr <= len) {
    allSmallerCount.push(curr);
    curr += 3;
  }
  const countSheet = generateCount(len, 4);
  const countLists = allSmallerCount.map((e) => countSheet[e]).flat();
  const gapSheet = generateGap(len - 1, 3);
  const map = new Map<string, number>();
  countLists.forEach((countList, _index) => {
    const gapLists = gapSheet[countList.length - 1];
    gapLists.forEach((gapList) => {
      // generate sheet from gap and count
      const result: number[][] = [];
      let temp: number[] = [];
      for (let i = 0; i < countList.length; i++) {
        temp.push(countList[i]);
        if (gapList[i]) {
          switch (gapList[i]) {
            case 1:
              temp.push(0);
              break;
            case 2:
              result.push(temp);
              temp = [];
              break;
          }
        }
      }
      result.push(temp);

      const isMoreThanMax = result.reduce(
        (prev, curr) => prev && curr.length <= 9,
        true
      ); // if the list longer than 9, not a correct list
      const pattern = sheetToPattern(result);
      if (isMoreThanMax && !map.has(pattern)) {
        sum++;
        if (useShortCut) {
          const simplified = simplifySheet(result);
          const simplifiedPattern = sheetToPattern(simplified.sheet);
          const simplifiedDistance = map.get(simplifiedPattern);
          if (simplifiedDistance !== undefined) {
            map.set(pattern, simplifiedDistance + simplified.addDistance);
          } else {
            map.set(pattern, calcDistance(result));
          }
        } else {
          map.set(pattern, calcDistance(result));
        }
      }
      if (sum % 1000 === 0) {
        const text = `\r\x1b[K${sum}/${total} ${((sum / total) * 100).toFixed(
          4
        )}% total:${(new Date().getTime() - startTime) / 1000}s`;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(text);
      }
    });
  });
  console.log(
    `\ncount:${map.size} time:${(new Date().getTime() - startTime) / 1000}s`
  );
  return map;
};

const SAMPLE_LIST = [
  [1],
  [1, 0, 1],
  [1, 1, 0, 1],
  [1, 0, 1, 1],
  [1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const removeListFromSheet = (sheet: number[][], listToRemove: number[]) => {
  const removeIndex = sheet.findLastIndex(
    (e) => compareList(e, listToRemove) === 0
  );
  if (removeIndex !== -1) {
    sheet.splice(removeIndex, 1);
    return sheet;
  } else {
    return sheet;
  }
};

const simplifySheet: (sheet: number[][]) => {
  sheet: number[][];
  addDistance: number;
} = (sheet: number[][]) => {
  const record = new Array(SAMPLE_LIST.length).fill(0);
  sheet.forEach((list) => {
    SAMPLE_LIST.forEach((sample, index) => {
      if (compareList(list, sample) === 0) {
        record[index]++;
      }
    });
  });
  let newSheet = sheet;
  let addDistance = 0;
  if (record[0] >= 3) {
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[0]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[0]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[0]);
    addDistance = 2;
  } else if (record[0] >= 1 && record[1] >= 1) {
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[0]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[1]);
    addDistance = 1;
  } else if (record[2] >= 1 || record[3] >= 1) {
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[2]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[3]);
    addDistance = 1;
  } else if (record[4] >= 1 || record[5] >= 1 || record[6] >= 1) {
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[4]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[5]);
    newSheet = removeListFromSheet(newSheet, SAMPLE_LIST[6]);
    addDistance = 0;
  }
  return { sheet: newSheet, addDistance };
};

export const writeToFile = async () => {
  // 87864ms
  // 100176ms
  const useShortCut = true;
  const len = 14;
  const resultMap = generateResultMap(len, useShortCut);
  try {
    await fs.mkdir("./output");
  } catch {}
  await fs.writeFile(
    `./output/data${useShortCut ? "-short" : ""}-${len}.txt`,
    [...resultMap.entries()].map((e) => `${e[0]}>${e[1]}`).join("\n")
  );
};
